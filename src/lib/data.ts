import { createSupabaseClient } from './supabase';

// ホームページ用の統計情報を取得
export async function getStats() {
  try {
    const supabase = createSupabaseClient();
    
    // 総ページ数の取得
    const { count: totalPages, error: pagesError } = await supabase
      .from('notion_pages')
      .select('*', { count: 'exact', head: true });
    
    if (pagesError) {
      console.error('ページ数取得エラー:', pagesError);
      throw new Error(`ページ数の取得に失敗しました: ${pagesError.message}`);
    }
    
    // 最新の同期情報の取得
    const { data: syncData, error: syncError } = await supabase
      .from('notion_sync_status')
      .select('*')
      .order('last_sync_time', { ascending: false })
      .limit(1);
    
    if (syncError) {
      console.error('同期情報取得エラー:', syncError);
      throw new Error(`同期情報の取得に失敗しました: ${syncError.message}`);
    }
    
    // カテゴリごとのページ数を取得
    const { data: categoryData, error: categoryError } = await supabase
      .from('notion_pages')
      .select('category');
    
    if (categoryError) {
      console.error('カテゴリ情報取得エラー:', categoryError);
      throw new Error(`カテゴリ情報の取得に失敗しました: ${categoryError.message}`);
    }
    
    // カテゴリごとのページ数を計算
    const categoryStats: Record<string, number> = {};
    categoryData.forEach(item => {
      const category = item.category || '未分類';
      categoryStats[category] = (categoryStats[category] || 0) + 1;
    });
    
    // 最終同期からの経過時間を計算
    let timeSinceLastSync = null;
    if (syncData && syncData.length > 0 && syncData[0].last_sync_time) {
      const lastSyncTime = new Date(syncData[0].last_sync_time);
      const now = new Date();
      const diffMs = now.getTime() - lastSyncTime.getTime();
      
      // 経過時間を人間が読みやすい形式に変換
      if (diffMs < 60000) { // 1分未満
        timeSinceLastSync = '1分未満前';
      } else if (diffMs < 3600000) { // 1時間未満
        const minutes = Math.floor(diffMs / 60000);
        timeSinceLastSync = `${minutes}分前`;
      } else if (diffMs < 86400000) { // 1日未満
        const hours = Math.floor(diffMs / 3600000);
        timeSinceLastSync = `${hours}時間前`;
      } else { // 1日以上
        const days = Math.floor(diffMs / 86400000);
        timeSinceLastSync = `${days}日前`;
      }
    }
    
    return {
      totalPages: totalPages || 0,
      latestSync: syncData && syncData.length > 0 ? syncData[0] : null,
      timeSinceLastSync,
      categoryStats
    };
  } catch (error) {
    console.error('統計情報取得エラー:', error);
    throw error;
  }
}

// 最新のページ一覧を取得
export async function getLatestPages(limit = 5) {
  try {
    const supabase = createSupabaseClient();
    
    const { data: pages, error } = await supabase
      .from('notion_pages')
      .select('id, title, category, last_edited_time')
      .order('last_edited_time', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('最新ページ取得エラー:', error);
      throw new Error(`最新ページの取得に失敗しました: ${error.message}`);
    }
    
    return { pages: pages || [] };
  } catch (error) {
    console.error('最新ページ取得エラー:', error);
    throw error;
  }
}

// Wikiページ一覧を取得
export async function getWikiPages(params: { 
  category?: string; 
  search?: string; 
  page?: number;
  limit?: number;
}) {
  try {
    const supabase = createSupabaseClient();
    const { category, search, page = 1, limit = 10 } = params;
    
    // ベースクエリ
    let query = supabase
      .from('notion_pages')
      .select('id, title, category, last_edited_time', { count: 'exact' });
    
    // フィルタリング
    if (category) {
      query = query.eq('category', category);
    }
    
    if (search) {
      query = query.ilike('title', `%${search}%`);
    }
    
    // ページネーション
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    // データ取得
    const { data: pages, count, error } = await query
      .order('last_edited_time', { ascending: false })
      .range(from, to);
    
    if (error) {
      console.error('ページ一覧取得エラー:', error);
      throw new Error(`ページ一覧の取得に失敗しました: ${error.message}`);
    }
    
    // カテゴリ一覧取得
    const { data: categoryData, error: categoryError } = await supabase
      .from('notion_pages')
      .select('category')
      .not('category', 'is', null);
    
    if (categoryError) {
      console.error('カテゴリ一覧取得エラー:', categoryError);
      throw new Error(`カテゴリ一覧の取得に失敗しました: ${categoryError.message}`);
    }
    
    // 重複なしのカテゴリリスト
    const categories = Array.from(
      new Set(categoryData.map(item => item.category).filter(Boolean))
    );
    
    return {
      pages: pages || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
      categories
    };
  } catch (error) {
    console.error('ページ一覧取得エラー:', error);
    throw error;
  }
}

// ページ詳細を取得
export async function getPageDetail(id: string) {
  try {
    const supabase = createSupabaseClient();
    
    // ページ情報を取得
    const { data: page, error: pageError } = await supabase
      .from('notion_pages')
      .select('*')
      .eq('id', id)
      .single();
    
    if (pageError) {
      console.error('ページ詳細取得エラー:', pageError);
      if (pageError.code === 'PGRST116') {
        return null; // ページが見つからない
      }
      throw new Error(`ページ詳細の取得に失敗しました: ${pageError.message}`);
    }
    
    // ブロックデータを取得
    const { data: blocks, error: blocksError } = await supabase
      .from('notion_blocks')
      .select('*')
      .eq('page_id', id)
      .order('sort_order');
    
    if (blocksError) {
      console.error('ブロック取得エラー:', blocksError);
      throw new Error(`ページコンテンツの取得に失敗しました: ${blocksError.message}`);
    }
    
    // 関連ページを取得（同じカテゴリのページ）
    interface RelatedPage {
      id: string;
      title: string;
      category?: string;
    }
    
    let relatedPages: RelatedPage[] = [];
    if (page.category) {
      const { data: related, error: relatedError } = await supabase
        .from('notion_pages')
        .select('id, title, category')
        .eq('category', page.category)
        .not('id', 'eq', id)
        .order('last_edited_time', { ascending: false })
        .limit(5);
      
      if (!relatedError && related) {
        relatedPages = related;
      }
    }
    
    return {
      page,
      blocks: blocks || [],
      relatedPages
    };
  } catch (error) {
    console.error('ページ詳細取得エラー:', error);
    throw error;
  }
} 