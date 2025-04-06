import Link from 'next/link';
import { ArrowRight, BookOpen, RefreshCw, Tag, Clock, Users, Award, Code, BookMarked, Lightbulb } from 'lucide-react';
import HomeButtons from '@/components/HomeButtons';
import { getStats, getLatestPages } from '@/lib/data';

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
    authors?: string[];
    status?: string;
  }[];
}

async function getHomeStats(): Promise<WikiStats> {
  try {
    // 開発環境のみダミーデータを使用
    if (process.env.NODE_ENV === 'development') {
      return {
        totalPages: 10,
        latestSync: {
          status: 'completed',
          pages_synced: 10,
          blocks_synced: 120,
          last_sync_time: new Date().toISOString()
        },
        timeSinceLastSync: '1時間前',
        categoryStats: {
          'FRC': 3,
          'FTC': 2,
          'FLL': 1,
          'チュートリアル': 2,
          'イベント': 1,
          'その他': 1
        }
      };
    }
    
    // 本番環境では直接Supabaseからデータを取得
    return await getStats();
  } catch (error) {
    console.error('統計情報取得エラー:', error);
    
    // エラー時もダミーデータを返す
    return {
      totalPages: 0,
      latestSync: null,
      timeSinceLastSync: null,
      categoryStats: {}
    };
  }
}

async function fetchLatestPages(): Promise<LatestPages> {
  try {
    // 開発環境のみダミーデータを使用
    if (process.env.NODE_ENV === 'development') {
      return {
        pages: [
          { 
            id: '1', 
            title: 'FRC 2024 ルール概要', 
            category: 'FRC', 
            last_edited_time: '2024-01-15T12:00:00Z',
            authors: ['山田太郎']
          },
          { 
            id: '2', 
            title: 'FTC パーツリスト', 
            category: 'FTC', 
            last_edited_time: '2024-01-14T15:30:00Z',
            authors: ['鈴木花子', '田中一郎']
          },
          { 
            id: '3', 
            title: 'プログラミング入門', 
            category: 'チュートリアル', 
            last_edited_time: '2024-01-13T09:45:00Z',
            authors: ['佐藤次郎']
          }
        ]
      };
    }
    
    // 本番環境では直接Supabaseからデータを取得
    return await getLatestPages(3);
  } catch (error) {
    console.error('最新ページ取得エラー:', error);
    
    // エラー時はダミーデータを返す
    return { pages: [] };
  }
}

export default async function Home() {
  const stats = await getHomeStats();
  const latestPages = await fetchLatestPages();
  
  return (
    <div className="space-y-16">
      {/* ヒーローセクション */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 -mx-4 px-4 py-16 sm:py-20 rounded-lg shadow-lg">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6 leading-tight">
            FIRST Program Japan Wiki
          </h1>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            日本のFIRSTプログラム参加者のための総合情報ポータル。
            ロボティクス競技の知識や経験を共有し、より良いコミュニティを構築します。
          </p>
          
          <HomeButtons />
        </div>
      </section>

      {/* FIRSTプログラムについて */}
      <section className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">FIRSTプログラムとは</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            FIRST (For Inspiration and Recognition of Science and Technology) は、若者たちに科学技術の興味を持ってもらい、
            革新的な思考を育むための国際的な非営利団体です。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col items-center text-center hover:shadow-md transition-shadow">
            <div className="bg-red-100 p-3 rounded-full mb-4">
              <Award className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="font-bold text-xl mb-2">FRC</h3>
            <p className="text-gray-600">
              FIRST Robotics Competition：高校生向けの大規模なロボット競技。チームで120ポンド以上のロボットを設計・製作します。
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col items-center text-center hover:shadow-md transition-shadow">
            <div className="bg-orange-100 p-3 rounded-full mb-4">
              <Code className="h-8 w-8 text-orange-600" />
            </div>
            <h3 className="font-bold text-xl mb-2">FTC</h3>
            <p className="text-gray-600">
              FIRST Tech Challenge：中高生向けのロボット競技。より小型のロボットを使い、アクセシビリティを重視したプログラムです。
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col items-center text-center hover:shadow-md transition-shadow">
            <div className="bg-green-100 p-3 rounded-full mb-4">
              <BookMarked className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="font-bold text-xl mb-2">FLL</h3>
            <p className="text-gray-600">
              FIRST LEGO League：9-16歳向けのLEGOを使った競技。科学的思考とチームワークを育みます。
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col items-center text-center hover:shadow-md transition-shadow">
            <div className="bg-purple-100 p-3 rounded-full mb-4">
              <Lightbulb className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="font-bold text-xl mb-2">FLL Jr.</h3>
            <p className="text-gray-600">
              FIRST LEGO League Jr.：6-10歳の子どもたちが参加できる入門プログラム。遊びながら学ぶことを重視しています。
            </p>
          </div>
        </div>
      </section>
      
      {/* 統計情報 */}
      <section className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Wikiの状況</h2>
          <p className="text-lg text-gray-600">最新の統計情報を確認できます</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-500 font-medium">総ページ数</h3>
              <BookOpen className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-gray-800">{stats.totalPages}</p>
            <p className="mt-2 text-sm text-gray-500">最終更新: {stats.timeSinceLastSync || 'なし'}</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
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
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 col-span-1 md:col-span-2 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-500 font-medium">カテゴリ分布</h3>
              <Tag className="h-5 w-5 text-purple-500" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
              {Object.entries(stats.categoryStats || {}).map(([category, count]) => (
                <div key={category} className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded hover:bg-gray-100 transition-colors">
                  <span className="font-medium">{category}</span>
                  <span className="text-gray-600">{count as number}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Wikiの特徴 */}
      <section className="max-w-6xl mx-auto bg-gray-50 -mx-4 px-8 py-12 rounded-lg">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">FIRST Program Japan Wikiの特徴</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            FIRSTプログラムに参加する日本のチームを支援するための総合情報リソース
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="font-bold text-xl mb-3 text-blue-700">日本語での情報提供</h3>
            <p className="text-gray-600">
              FIRSTプログラムに関する情報を日本語で提供することで、言語の壁を取り除き、より多くの学生や指導者が参加できるようにサポートします。
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="font-bold text-xl mb-3 text-blue-700">コミュニティ主導</h3>
            <p className="text-gray-600">
              内容はFIRSTプログラムの参加者自身によって作成・編集され、日本の状況に適した実践的な情報を提供します。
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="font-bold text-xl mb-3 text-blue-700">総合的なリソース</h3>
            <p className="text-gray-600">
              競技ルールの解説から、ロボット製作のテクニック、プログラミングのヒント、チーム運営のアドバイスまで幅広くカバーしています。
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="font-bold text-xl mb-3 text-blue-700">定期的な更新</h3>
            <p className="text-gray-600">
              最新のルール変更や技術動向を反映し、常に最新の情報を提供することを目指しています。
            </p>
          </div>
        </div>
      </section>
      
      {/* 最近の投稿 */}
      <section className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800">最近の投稿</h2>
          <Link href="/wiki" className="text-blue-600 hover:text-blue-800 flex items-center text-lg">
            すべて見る <ArrowRight className="ml-1 h-5 w-5" />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {latestPages.pages.map((page) => (
            <Link key={page.id} href={`/wiki/${page.id}`}>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-full hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                    {page.category || '未分類'}
                  </span>
                  <div className="flex items-center text-xs text-gray-500">
                    <Clock className="w-3 h-3 mr-1" />
                    {new Date(page.last_edited_time).toLocaleString('ja-JP', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{page.title}</h3>
                {page.authors && page.authors.length > 0 && (
                  <div className="flex items-center text-xs text-gray-600 mt-2">
                    <Users className="w-3 h-3 mr-1" />
                    {page.authors.join(', ')}
                  </div>
                )}
                <p className="text-gray-600 text-sm mt-3">詳細を見る...</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* コミュニティへの参加呼びかけ */}
      <section className="bg-blue-50 -mx-4 px-8 py-12 rounded-lg text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">コミュニティに参加しよう</h2>
          <p className="text-lg text-gray-700 mb-8">
            FIRST Program Japan Wikiはみなさんの貢献によって成長します。
            知識や経験を共有して、日本のFIRSTコミュニティをより強く、より活発にしていきましょう。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/edit" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-lg font-medium"
            >
              ページを書く
            </Link>
            <Link 
              href="/contact" 
              className="bg-white hover:bg-gray-100 text-blue-600 border border-blue-300 px-6 py-3 rounded-lg text-lg font-medium"
            >
              お問い合わせ
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
} 