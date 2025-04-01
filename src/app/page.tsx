import Link from 'next/link';
import { ArrowRight, BookOpen, RefreshCw, Tag, Search, Filter } from 'lucide-react';
import HomeButtons from '@/components/HomeButtons';

// 型定義
interface WikiStats {
  totalPages: number;
  latestSync: {
    status: string;
    last_sync_time: string;
    pages_synced: number;
    blocks_synced: number;
  } | null;
  timeSinceLastSync: string | null;
  categoryStats: Record<string, number>;
}

interface LatestPages {
  pages: {
    id: string;
    title: string;
    category: string;
    last_edited_time: string;
  }[];
}

async function getWikiStats(): Promise<WikiStats> {
  // 本番環境ではAPI呼び出しになる
  // クライアント側の開発時はダミーデータを返す
  if (process.env.NODE_ENV === 'development') {
    return {
      totalPages: 42,
      latestSync: {
        status: 'completed',
        last_sync_time: new Date().toISOString(),
        pages_synced: 42,
        blocks_synced: 312
      },
      timeSinceLastSync: '3時間前',
      categoryStats: {
        'FRC': 15,
        'FTC': 12,
        'FLL': 8,
        'その他': 7
      }
    };
  }
  
  try {
    // ベースURLが設定されていない場合はダミーデータを返す
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    if (!baseUrl) {
      console.warn('NEXT_PUBLIC_BASE_URL が設定されていません。ダミーデータを使用します。');
      return {
        totalPages: 0,
        latestSync: null,
        timeSinceLastSync: null,
        categoryStats: {}
      };
    }
    
    // 完全なURLを使用
    const res = await fetch(`${baseUrl}/api/sync-status`, {
      next: { revalidate: 60 } // 1分ごとに再検証
    });
    
    if (!res.ok) {
      throw new Error('統計情報の取得に失敗しました');
    }
    
    return await res.json();
  } catch (error) {
    console.error('APIエラー:', error);
    return {
      totalPages: 0,
      latestSync: null,
      timeSinceLastSync: null,
      categoryStats: {}
    };
  }
}

async function getLatestPages(): Promise<LatestPages> {
  // 本番環境ではAPI呼び出しになる
  // クライアント側の開発時はダミーデータを返す
  if (process.env.NODE_ENV === 'development') {
    return {
      pages: [
        { id: '1', title: 'FRC 2024 ルール概要', category: 'FRC', last_edited_time: '2024-01-15T12:00:00Z' },
        { id: '2', title: 'FTC パーツリスト', category: 'FTC', last_edited_time: '2024-01-14T15:30:00Z' },
        { id: '3', title: 'プログラミング入門', category: 'チュートリアル', last_edited_time: '2024-01-13T09:45:00Z' },
        { id: '4', title: '日本大会レポート', category: 'イベント', last_edited_time: '2024-01-12T18:20:00Z' },
        { id: '5', title: 'FLL チャレンジ攻略法', category: 'FLL', last_edited_time: '2024-01-11T14:10:00Z' },
      ]
    };
  }
  
  try {
    // ベースURLが設定されていない場合はダミーデータを返す
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    if (!baseUrl) {
      console.warn('NEXT_PUBLIC_BASE_URL が設定されていません。ダミーデータを使用します。');
      return {
        pages: []
      };
    }
    
    // 完全なURLを使用
    const res = await fetch(`${baseUrl}/api/wiki?limit=5`, {
      next: { revalidate: 60 } // 1分ごとに再検証
    });
    
    if (!res.ok) {
      throw new Error('ページ一覧の取得に失敗しました');
    }
    
    return await res.json();
  } catch (error) {
    console.error('APIエラー:', error);
    return { pages: [] };
  }
}

export default async function Home() {
  const stats = await getWikiStats();
  const latestPages = await getLatestPages();
  
  return (
    <div className="space-y-10">
      {/* ヒーローセクション */}
      <section className="bg-blue-50 -mx-4 px-4 py-12 sm:py-16 rounded-lg">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 leading-tight">
            FIRST Program Japan <br />
            <span className="text-blue-200">非公式ウィキサイト</span>
          </h1>
          <p className="text-xl text-blue-100 mb-8">
            ロボティクス競技会に関する情報共有のためのコミュニティサイト
          </p>
          
          <HomeButtons />
        </div>
      </section>
      
      {/* 統計情報 */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-500 font-medium">総ページ数</h3>
            <BookOpen className="h-5 w-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-gray-800">{stats.totalPages}</p>
          <p className="mt-2 text-sm text-gray-500">最終更新: {stats.timeSinceLastSync || 'なし'}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-500 font-medium">同期ステータス</h3>
            <RefreshCw className="h-5 w-5 text-green-500" />
          </div>
          <p className="text-xl font-bold text-gray-800">
            {stats.latestSync?.status === 'completed' ? '完了' : 
             stats.latestSync?.status === 'running' ? '同期中' : 'なし'}
          </p>
          <p className="mt-2 text-sm text-gray-500">
            {stats.latestSync ? `${stats.latestSync.pages_synced}ページ・${stats.latestSync.blocks_synced}ブロック同期済み` : ''}
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 col-span-1 md:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-500 font-medium">カテゴリ分布</h3>
            <Tag className="h-5 w-5 text-purple-500" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
            {Object.entries(stats.categoryStats || {}).map(([category, count]) => (
              <div key={category} className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded">
                <span className="font-medium">{category}</span>
                <span className="text-gray-600">{count as number}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* 最近の投稿 */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">最近の投稿</h2>
          <Link href="/wiki" className="text-blue-600 hover:text-blue-800 flex items-center">
            すべて見る <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {latestPages.pages.map((page) => (
            <Link key={page.id} href={`/wiki/${page.id}`}>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-full hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                    {page.category || '未分類'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(page.last_edited_time).toLocaleDateString('ja-JP')}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{page.title}</h3>
                <p className="text-gray-600 text-sm">詳細を見る...</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
} 