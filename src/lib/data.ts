import { createSupabaseClient } from './supabase';

// ホームページ用の統計情報を取得
export async function getStats() {
  const maxRetries = 3;
  let retryCount = 0;
  
  while (retryCount < maxRetries) {
    try {
      const supabase = createSupabaseClient();
      
      // 総ページ数の取得
      const { count: totalPages, error: pagesError } = await supabase
        .from('notion_pages')
        .select('*', { count: 'exact', head: true });
      
      if (pagesError) {
        console.error(`ページ数取得エラー (試行 ${retryCount + 1}/${maxRetries}):`, pagesError);
        retryCount++;
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        continue;
      }
      
      // 最新の同期情報の取得
      const { data: syncData, error: syncError } = await supabase
        .from('notion_sync_status')
        .select('*')
        .order('last_sync_time', { ascending: false })
        .limit(1);
      
      if (syncError) {
        console.error(`同期情報取得エラー (試行 ${retryCount + 1}/${maxRetries}):`, syncError);
        retryCount++;
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        continue;
      }
      
      // カテゴリごとのページ数を取得
      const { data: categoryData, error: categoryError } = await supabase
        .from('notion_pages')
        .select('category');
      
      if (categoryError) {
        console.error(`カテゴリ情報取得エラー (試行 ${retryCount + 1}/${maxRetries}):`, categoryError);
        retryCount++;
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        continue;
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
      console.error(`統計情報取得中の例外 (試行 ${retryCount + 1}/${maxRetries}):`, error);
      retryCount++;
      await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
    }
  }
  
  console.error(`最大再試行回数(${maxRetries})に達しました。統計情報取得に失敗しました。`);
  // エラー時はダミーデータを返す
  return {
    totalPages: 0,
    latestSync: null,
    timeSinceLastSync: 'エラーのため不明',
    categoryStats: { 'エラー': 1 }
  };
}

// 最新のページ一覧を取得
export async function getLatestPages(limit = 5) {
  const maxRetries = 3;
  let retryCount = 0;
  let lastError = null;

  while (retryCount < maxRetries) {
    try {
      const supabase = createSupabaseClient();
      
      // クエリパラメータをシンプルに保つ
      const { data: pages, error } = await supabase
        .from('notion_pages')
        .select('id,title,category,created_time,last_edited_time,authors,status')
        .order('last_edited_time', { ascending: false })
        .limit(limit);
      
      if (error) {
        console.error(`最新ページ取得エラー (試行 ${retryCount + 1}/${maxRetries}):`, error);
        lastError = error;
        retryCount++;
        // 再試行前に少し待機
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        continue;
      }
      
      // 日時とauthorsがない場合に対応
      const mappedPages = pages?.map(page => ({
        ...page,
        last_edited_time: page.last_edited_time || page.created_time,
        authors: Array.isArray(page.authors) ? page.authors : []
      })) || [];
      
      return { pages: mappedPages };
    } catch (error) {
      console.error(`最新ページ取得中の例外 (試行 ${retryCount + 1}/${maxRetries}):`, error);
      lastError = error;
      retryCount++;
      // 再試行前に少し待機
      await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
    }
  }

  console.error(`最大再試行回数(${maxRetries})に達しました。最新ページ取得に失敗しました。`);
  // エラー時はダミーデータを返す
  return { 
    pages: [
      { 
        id: 'error-1', 
        title: 'データ取得エラー', 
        category: 'エラー', 
        last_edited_time: new Date().toISOString(),
        authors: []
      }
    ]
  };
}

// Wikiページ一覧を取得
export async function getWikiPages(params: { 
  category?: string; 
  search?: string; 
  page?: number;
  limit?: number;
}) {
  const maxRetries = 3;
  let retryCount = 0;
  
  while (retryCount < maxRetries) {
    try {
      const supabase = createSupabaseClient();
      const { category, search, page = 1, limit = 10 } = params;
      
      // ベースクエリ
      let query = supabase
        .from('notion_pages')
        .select('id,title,category,created_time', { count: 'exact' });
      
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
        .order('created_time', { ascending: false })
        .range(from, to);
      
      if (error) {
        console.error(`ページ一覧取得エラー (試行 ${retryCount + 1}/${maxRetries}):`, error);
        retryCount++;
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        continue;
      }
      
      // カテゴリ一覧取得
      const { data: categoryData, error: categoryError } = await supabase
        .from('notion_pages')
        .select('category')
        .not('category', 'is', null);
      
      if (categoryError) {
        console.error(`カテゴリ一覧取得エラー (試行 ${retryCount + 1}/${maxRetries}):`, categoryError);
        retryCount++;
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        continue;
      }
      
      // 重複なしのカテゴリリスト
      const categories = Array.from(
        new Set(categoryData.map(item => item.category).filter(Boolean))
      );
      
      // created_timeをlast_edited_timeとして返すためのマッピング
      const mappedPages = pages?.map(page => ({
        ...page,
        last_edited_time: page.created_time
      })) || [];
      
      return {
        pages: mappedPages,
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
        categories
      };
    } catch (error) {
      console.error(`ページ一覧取得中の例外 (試行 ${retryCount + 1}/${maxRetries}):`, error);
      retryCount++;
      await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
    }
  }
  
  console.error(`最大再試行回数(${maxRetries})に達しました。ページ一覧取得に失敗しました。`);
  // エラー時はダミーデータを返す
  return {
    pages: [
      { id: 'error-1', title: 'データ取得エラー', category: 'エラー', last_edited_time: new Date().toISOString() }
    ],
    total: 1,
    page: 1,
    limit: 10,
    totalPages: 1,
    categories: ['エラー']
  };
}

// ページ詳細を取得
export async function getPageDetail(id: string) {
  const maxRetries = 3;
  let retryCount = 0;
  
  // 関連ページの型定義
  interface RelatedPage {
    id: string;
    title: string;
    category?: string;
    authors?: string[];
    status?: string;
  }
  
  while (retryCount < maxRetries) {
    try {
      const supabase = createSupabaseClient();
      
      // ページ情報を取得
      const { data: page, error: pageError } = await supabase
        .from('notion_pages')
        .select('id,title,category,created_time,last_edited_time,authors,status,notion_url')
        .eq('id', id)
        .single();
      
      if (pageError) {
        console.error(`ページ取得エラー (試行 ${retryCount + 1}/${maxRetries}):`, pageError);
        retryCount++;
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        continue;
      }
      
      if (!page) {
        console.error(`ページが見つかりません。ID: ${id}`);
        return null;
      }
      
      // ブロック（コンテンツ）情報を取得
      const { data: blocks, error: blocksError } = await supabase
        .from('notion_blocks')
        .select('id,type,content,has_children,sort_order')
        .eq('page_id', id)
        .order('sort_order', { ascending: true });
      
      if (blocksError) {
        console.error(`ブロック取得エラー (試行 ${retryCount + 1}/${maxRetries}):`, blocksError);
        retryCount++;
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        continue;
      }
      
      // 関連ページを取得（同じカテゴリーの別ページ）
      let relatedPages: RelatedPage[] = [];
      if (page.category) {
        const { data: related, error: relatedError } = await supabase
          .from('notion_pages')
          .select('id,title,category,authors,status')
          .eq('category', page.category)
          .not('id', 'eq', id)
          .order('last_edited_time', { ascending: false })
          .limit(5);
        
        if (relatedError) {
          console.error(`関連ページ取得エラー (試行 ${retryCount + 1}/${maxRetries}):`, relatedError);
          // 関連ページの取得失敗は致命的ではないので再試行しない
        } else if (related) {
          // 関連ページの各ページでauthorsが配列であることを確認
          relatedPages = related.map(page => ({
            ...page,
            authors: Array.isArray(page.authors) ? page.authors : []
          }));
        }
      }
      
      // データ整形
      const enhancedPage = {
        ...page,
        last_edited_time: page.last_edited_time || page.created_time, // last_edited_timeがない場合はcreated_timeを使用
        authors: Array.isArray(page.authors) ? page.authors : [],
        status: page.status || '未設定'
      };
      
      return {
        page: enhancedPage,
        blocks: blocks || [],
        relatedPages
      };
    } catch (error) {
      console.error(`ページ詳細取得中の例外 (試行 ${retryCount + 1}/${maxRetries}):`, error);
      retryCount++;
      await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
    }
  }
  
  console.error(`最大再試行回数(${maxRetries})に達しました。ページ詳細取得に失敗しました。ID: ${id}`);
  // エラー時はnullを返す（notFoundとなる）
  return null;
}

// カテゴリ一覧を取得
export async function getCategories(): Promise<string[]> {
  const maxRetries = 3;
  let retryCount = 0;
  
  while (retryCount < maxRetries) {
    try {
      const supabase = createSupabaseClient();
      
      // カテゴリ一覧取得
      const { data: categoryData, error: categoryError } = await supabase
        .from('notion_pages')
        .select('category')
        .not('category', 'is', null);
      
      if (categoryError) {
        console.error(`カテゴリ一覧取得エラー (試行 ${retryCount + 1}/${maxRetries}):`, categoryError);
        retryCount++;
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        continue;
      }
      
      // 重複なしのカテゴリリスト
      const categories = Array.from(
        new Set(categoryData.map(item => item.category).filter(Boolean))
      );
      
      return categories as string[];
    } catch (error) {
      console.error(`カテゴリ一覧取得中の例外 (試行 ${retryCount + 1}/${maxRetries}):`, error);
      retryCount++;
      await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
    }
  }
  
  console.error(`最大再試行回数(${maxRetries})に達しました。カテゴリ一覧取得に失敗しました。`);
  
  // 開発環境のみダミーデータを返す
  if (process.env.NODE_ENV === 'development') {
    return ['FRC', 'FTC', 'FLL', 'チュートリアル', 'イベント', 'その他'];
  }
  
  // エラー時は空配列を返す
  return [];
} 