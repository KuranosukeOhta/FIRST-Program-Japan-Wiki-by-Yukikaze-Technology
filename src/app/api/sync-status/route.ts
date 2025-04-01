import { NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic'; // 常に動的に生成

export async function GET() {
  try {
    const supabase = createSupabaseClient();
    console.log('Supabase接続設定:', {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    });
    
    // 総ページ数の取得
    const { count: totalPages, error: pagesError } = await supabase
      .from('notion_pages')
      .select('*', { count: 'exact', head: true });
    
    if (pagesError) {
      console.error('ページ数取得エラー詳細:', pagesError);
      return NextResponse.json({ error: 'ページ数の取得に失敗しました', details: pagesError.message, code: pagesError.code }, { status: 500 });
    }
    
    // 最新の同期情報の取得
    const { data: syncData, error: syncError } = await supabase
      .from('notion_sync_status')
      .select('*')
      .order('last_sync_time', { ascending: false })
      .limit(1);
    
    if (syncError) {
      console.error('同期情報取得エラー詳細:', syncError);
      return NextResponse.json({ error: '同期情報の取得に失敗しました', details: syncError.message, code: syncError.code }, { status: 500 });
    }
    
    // カテゴリごとのページ数を取得
    const { data: categoryData, error: categoryError } = await supabase
      .from('notion_pages')
      .select('category');
    
    if (categoryError) {
      console.error('カテゴリ情報取得エラー詳細:', categoryError);
      return NextResponse.json({ error: 'カテゴリ情報の取得に失敗しました', details: categoryError.message, code: categoryError.code }, { status: 500 });
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
    
    return NextResponse.json({
      totalPages: totalPages || 0,
      latestSync: syncData && syncData.length > 0 ? syncData[0] : null,
      timeSinceLastSync,
      categoryStats
    });
  } catch (error) {
    console.error('APIエラー詳細:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
} 