import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase';

// APIルートを動的に生成するように設定
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const category = searchParams.get('category') || '';
  const search = searchParams.get('search') || '';
  const page = Number(searchParams.get('page')) || 1;
  const limit = Number(searchParams.get('limit')) || 10;
  
  // 開発環境用のダミーデータ
  if (process.env.NODE_ENV === 'development') {
    // カテゴリでフィルタリング
    let filteredPages = [
      { id: '1', title: 'FRC 2024 ルール概要', category: 'FRC', last_edited_time: '2024-01-15T12:00:00Z' },
      { id: '2', title: 'FTC パーツリスト', category: 'FTC', last_edited_time: '2024-01-14T15:30:00Z' },
      { id: '3', title: 'プログラミング入門', category: 'チュートリアル', last_edited_time: '2024-01-13T09:45:00Z' },
      { id: '4', title: '日本大会レポート', category: 'イベント', last_edited_time: '2024-01-12T18:20:00Z' },
      { id: '5', title: 'FLL チャレンジ攻略法', category: 'FLL', last_edited_time: '2024-01-11T14:10:00Z' },
      { id: '6', title: 'ロボットデザイン基礎', category: 'チュートリアル', last_edited_time: '2024-01-10T10:10:00Z' },
      { id: '7', title: 'センサー活用方法', category: 'FTC', last_edited_time: '2024-01-09T11:30:00Z' },
      { id: '8', title: 'FRC 競技戦略', category: 'FRC', last_edited_time: '2024-01-08T16:40:00Z' },
      { id: '9', title: 'チーム運営ガイド', category: 'その他', last_edited_time: '2024-01-07T13:20:00Z' },
      { id: '10', title: 'スポンサー獲得術', category: 'その他', last_edited_time: '2024-01-06T09:10:00Z' },
    ];
    
    if (category) {
      filteredPages = filteredPages.filter(page => page.category === category);
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredPages = filteredPages.filter(page => 
        page.title.toLowerCase().includes(searchLower)
      );
    }
    
    const categories: string[] = ['FRC', 'FTC', 'FLL', 'チュートリアル', 'イベント', 'その他'];
    
    return NextResponse.json({
      pages: filteredPages,
      total: filteredPages.length,
      page,
      limit,
      totalPages: Math.ceil(filteredPages.length / limit),
      categories
    });
  }
  
  try {
    const supabase = createSupabaseClient();
    
    let query = supabase
      .from('wiki_pages')
      .select('id, title, category, last_edited_time', { count: 'exact' });
      
    if (category) {
      query = query.eq('category', category);
    }
    
    if (search) {
      query = query.ilike('title', `%${search}%`);
    }
    
    // ページネーション
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    const { data: pages, count, error } = await query
      .order('last_edited_time', { ascending: false })
      .range(from, to);
      
    if (error) {
      console.error('Supabaseエラー:', error);
      return NextResponse.json(
        { error: 'ページの取得に失敗しました' }, 
        { status: 500 }
      );
    }
    
    // カテゴリ一覧を取得
    const { data: categoryData, error: categoryError } = await supabase
      .from('wiki_pages')
      .select('category')
      .not('category', 'is', null);
      
    if (categoryError) {
      console.error('カテゴリ取得エラー:', categoryError);
      return NextResponse.json(
        { error: 'カテゴリの取得に失敗しました' }, 
        { status: 500 }
      );
    }
    
    // カテゴリの重複を排除
    const categories = Array.from(new Set(
      categoryData
        .map(item => item.category)
        .filter(Boolean)
    ));
    
    return NextResponse.json({
      pages: pages || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
      categories
    });
  } catch (error) {
    console.error('APIエラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' }, 
      { status: 500 }
    );
  }
} 