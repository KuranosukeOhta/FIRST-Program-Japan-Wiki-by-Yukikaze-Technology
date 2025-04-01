import { NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase';

// APIルートを動的に生成するように設定
export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const pageId = params.id;
    if (!pageId) {
      return NextResponse.json({ error: 'ページIDが指定されていません' }, { status: 400 });
    }
    
    const supabase = createSupabaseClient();
    
    // ページ情報を取得
    const { data: page, error: pageError } = await supabase
      .from('notion_pages')
      .select('*')
      .eq('id', pageId)
      .single();
    
    if (pageError) {
      console.error('ページ取得エラー:', pageError);
      return NextResponse.json({ error: 'ページが見つかりません: ' + pageError.message }, { status: 404 });
    }
    
    // ページのブロック（コンテンツ）を取得
    const { data: blocks, error: blockError } = await supabase
      .from('notion_blocks')
      .select('*')
      .eq('page_id', pageId)
      .order('sort_order', { ascending: true });
    
    if (blockError) {
      console.error('ブロック取得エラー:', blockError);
      return NextResponse.json({ error: 'ページコンテンツの取得に失敗しました: ' + blockError.message }, { status: 500 });
    }
    
    // 関連ページを取得（同じカテゴリのページ）
    let relatedPages: any[] = [];
    if (page.category) {
      const { data: related, error: relatedError } = await supabase
        .from('notion_pages')
        .select('id, title, category')
        .eq('category', page.category)
        .not('id', 'eq', pageId)
        .order('last_edited_time', { ascending: false })
        .limit(5);
      
      if (!relatedError && related) {
        relatedPages = related;
      }
    }
    
    return NextResponse.json({
      page,
      blocks: blocks || [],
      relatedPages
    });
  } catch (error: any) {
    console.error('ページ詳細取得エラー:', error);
    
    return NextResponse.json({
      error: 'ページ詳細の取得中にエラーが発生しました',
      details: error.message
    }, { status: 500 });
  }
} 