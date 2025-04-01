import { NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = createSupabaseClient();
    
    // 最新の同期ステータスを取得
    const { data: latestSync, error: syncError } = await supabase
      .from('notion_sync_status')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (syncError) {
      console.error('同期ステータス取得エラー:', syncError);
      return NextResponse.json({ error: 'ステータス取得エラー' }, { status: 500 });
    }
    
    // ページ数とカテゴリの集計を取得
    const { data: pageStats, error: statsError } = await supabase
      .from('notion_pages')
      .select('category')
      .not('category', 'is', null);
    
    if (statsError) {
      console.error('ページ統計取得エラー:', statsError);
    }
    
    // カテゴリーごとのページ数を集計
    const categoryCount: Record<string, number> = {};
    if (pageStats) {
      pageStats.forEach(page => {
        const category = page.category || '未分類';
        categoryCount[category] = (categoryCount[category] || 0) + 1;
      });
    }
    
    // 最終同期日時から経過時間を計算
    let timeSinceLastSync = null;
    if (latestSync?.last_sync_time) {
      const lastSyncDate = new Date(latestSync.last_sync_time);
      const now = new Date();
      const diffMs = now.getTime() - lastSyncDate.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      
      if (diffHours < 24) {
        timeSinceLastSync = `${diffHours}時間前`;
      } else {
        const diffDays = Math.floor(diffHours / 24);
        timeSinceLastSync = `${diffDays}日前`;
      }
    }
    
    return NextResponse.json({
      latestSync,
      timeSinceLastSync,
      totalPages: pageStats?.length || 0,
      categoryStats: categoryCount
    });
  } catch (error: any) {
    console.error('ステータス取得エラー:', error);
    
    return NextResponse.json({
      error: 'ステータス取得中にエラーが発生しました',
      details: error.message
    }, { status: 500 });
  }
} 