import { NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const supabase = createSupabaseClient();
    const url = new URL(request.url);
    
    // クエリパラメータの取得
    const category = url.searchParams.get('category');
    const search = url.searchParams.get('search');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;
    
    // ベースとなるクエリを作成
    let query = supabase
      .from('notion_pages')
      .select('id, title, category, created_time, last_edited_time', { count: 'exact' });
    
    // フィルター条件の適用
    if (category) {
      query = query.eq('category', category);
    }
    
    if (search) {
      query = query.ilike('title', `%${search}%`);
    }
    
    // ページネーション適用
    const { data: pages, error, count } = await query
      .order('last_edited_time', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      console.error('ページ一覧取得エラー:', error);
      return NextResponse.json({ error: 'ページ一覧取得エラー' }, { status: 500 });
    }
    
    // カテゴリー一覧を取得
    const { data: categories, error: categoryError } = await supabase
      .from('notion_pages')
      .select('category')
      .not('category', 'is', null)
      .order('category')
      .limit(100);
    
    if (categoryError) {
      console.error('カテゴリー一覧取得エラー:', categoryError);
    }
    
    // 重複なしのカテゴリーリストを作成
    const uniqueCategories = Array.from(
      new Set(categories?.map(item => item.category).filter(Boolean))
    );
    
    return NextResponse.json({
      pages: pages || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
      categories: uniqueCategories
    });
  } catch (error: any) {
    console.error('API実行エラー:', error);
    
    return NextResponse.json({
      error: 'ページ一覧の取得中にエラーが発生しました',
      details: error.message
    }, { status: 500 });
  }
} 