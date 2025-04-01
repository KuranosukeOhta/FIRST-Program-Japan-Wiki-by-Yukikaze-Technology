import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase';

// APIルートを動的に生成するように設定
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  
  // 開発環境用のダミーデータ
  if (process.env.NODE_ENV === 'development') {
    return NextResponse.json({
      page: {
        id,
        title: `Wiki ページ ${id}`,
        category: 'FRC',
        last_edited_time: new Date().toISOString(),
        created_time: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 1週間前
      },
      blocks: [
        {
          id: 'block1',
          type: 'paragraph',
          paragraph: {
            rich_text: [
              {
                type: 'text',
                text: { content: 'これはダミーのWikiページです。' },
                annotations: { bold: false, italic: false, underline: false }
              }
            ]
          }
        },
        {
          id: 'block2',
          type: 'heading_2',
          heading_2: {
            rich_text: [
              {
                type: 'text',
                text: { content: '見出し' },
                annotations: { bold: false, italic: false, underline: false }
              }
            ]
          }
        },
        {
          id: 'block3',
          type: 'paragraph',
          paragraph: {
            rich_text: [
              {
                type: 'text',
                text: { content: 'このページは開発環境用のダミーデータです。' },
                annotations: { bold: false, italic: false, underline: false }
              }
            ]
          }
        }
      ]
    });
  }
  
  try {
    const supabase = createSupabaseClient();
    
    // ページ情報を取得
    const { data: page, error: pageError } = await supabase
      .from('notion_pages')
      .select('*')
      .eq('id', id)
      .single();
    
    if (pageError) {
      console.error('ページ取得エラー:', pageError);
      return NextResponse.json(
        { error: 'ページの取得に失敗しました' },
        { status: 404 }
      );
    }
    
    // ページに関連するブロックを取得
    const { data: blocks, error: blocksError } = await supabase
      .from('notion_blocks')
      .select('*')
      .eq('page_id', id)
      .order('sort_order');
    
    if (blocksError) {
      console.error('ブロック取得エラー:', blocksError);
      return NextResponse.json(
        { error: 'ページの内容取得に失敗しました' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      page,
      blocks: blocks || []
    });
  } catch (error) {
    console.error('APIエラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
} 