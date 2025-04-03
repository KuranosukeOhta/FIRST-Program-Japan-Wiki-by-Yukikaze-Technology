import Link from 'next/link';
import { Search, Filter, RefreshCw } from 'lucide-react';
import CategoryFilter from '@/components/CategoryFilter';
import { getWikiPages } from '@/lib/data';

// 型定義
interface WikiPageResult {
  pages: Array<{
    id: string;
    title: string;
    category: string;
    last_edited_time: string;
    authors?: string[];
  }>;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  categories: string[];
}

async function fetchWikiPages(searchParams: { [key: string]: string | string[] | undefined }): Promise<WikiPageResult> {
  // クエリパラメータを取得
  const category = searchParams.category as string || '';
  const search = searchParams.search as string || '';
  const page = Number(searchParams.page) || 1;
  
  // 開発環境のみダミーデータを返す
  if (process.env.NODE_ENV === 'development') {
    // カテゴリでフィルタリング
    let filteredPages = [
      { id: '1', title: 'FRC 2024 ルール概要', category: 'FRC', last_edited_time: '2024-01-15T12:00:00Z', authors: ['山田太郎'] },
      { id: '2', title: 'FTC パーツリスト', category: 'FTC', last_edited_time: '2024-01-14T15:30:00Z', authors: ['鈴木花子', '田中一郎'] },
      { id: '3', title: 'プログラミング入門', category: 'チュートリアル', last_edited_time: '2024-01-13T09:45:00Z', authors: ['佐藤次郎'] },
      { id: '4', title: '日本大会レポート', category: 'イベント', last_edited_time: '2024-01-12T18:20:00Z', authors: ['山本五郎'] },
      { id: '5', title: 'FLL チャレンジ攻略法', category: 'FLL', last_edited_time: '2024-01-11T14:10:00Z', authors: ['伊藤六郎'] },
      { id: '6', title: 'ロボットデザイン基礎', category: 'チュートリアル', last_edited_time: '2024-01-10T10:10:00Z', authors: ['高橋七郎'] },
      { id: '7', title: 'センサー活用方法', category: 'FTC', last_edited_time: '2024-01-09T11:30:00Z', authors: ['渡辺八郎'] },
      { id: '8', title: 'FRC 競技戦略', category: 'FRC', last_edited_time: '2024-01-08T16:40:00Z', authors: ['斎藤九郎'] },
      { id: '9', title: 'チーム運営ガイド', category: 'その他', last_edited_time: '2024-01-07T13:20:00Z', authors: ['小林十郎'] },
      { id: '10', title: 'スポンサー獲得術', category: 'その他', last_edited_time: '2024-01-06T09:10:00Z', authors: ['加藤十一郎', '松本十二郎'] },
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
    
    return {
      pages: filteredPages,
      total: filteredPages.length,
      page,
      limit: 10,
      totalPages: Math.ceil(filteredPages.length / 10),
      categories
    };
  }
  
  try {
    // 本番環境では直接Supabaseからデータを取得
    return await getWikiPages({
      category,
      search,
      page,
      limit: 10
    });
  } catch (error) {
    console.error('ページ一覧取得エラー:', error);
    // エラー時もダミーデータを返す
    return {
      pages: [
        { id: '1', title: 'FRC 2024 ルール概要', category: 'FRC', last_edited_time: '2024-01-15T12:00:00Z', authors: ['山田太郎'] },
        { id: '2', title: 'FTC パーツリスト', category: 'FTC', last_edited_time: '2024-01-14T15:30:00Z', authors: ['鈴木花子', '田中一郎'] },
        { id: '3', title: 'プログラミング入門', category: 'チュートリアル', last_edited_time: '2024-01-13T09:45:00Z', authors: ['佐藤次郎'] }
      ],
      total: 3,
      page: 1,
      limit: 10,
      totalPages: 1,
      categories: ['FRC', 'FTC', 'チュートリアル']
    };
  }
}

export default async function WikiPage({
  searchParams
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const result = await fetchWikiPages(searchParams);
  const currentCategory = searchParams.category as string || '';
  const currentSearch = searchParams.search as string || '';
  const currentPage = Number(searchParams.page) || 1;
  
  // ページネーションのリンク生成
  const generatePageLink = (pageNum: number) => {
    const params = new URLSearchParams();
    if (currentCategory) params.append('category', currentCategory);
    if (currentSearch) params.append('search', currentSearch);
    params.append('page', pageNum.toString());
    return `/wiki?${params.toString()}`;
  };
  
  // カテゴリリンク生成
  const generateCategoryLink = (category: string) => {
    const params = new URLSearchParams();
    params.append('category', category);
    if (currentSearch) params.append('search', currentSearch);
    return `/wiki?${params.toString()}`;
  };
  
  // カテゴリフィルタ解除リンク
  const getClearCategoryLink = () => {
    const params = new URLSearchParams();
    if (currentSearch) params.append('search', currentSearch);
    return `/wiki?${params.toString()}`;
  };
  
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">ウィキページ一覧</h1>
        <p className="text-gray-600">
          全{result.total}件中 {(currentPage - 1) * result.limit + 1}～
          {Math.min(currentPage * result.limit, result.total)}件表示
        </p>
      </div>
      
      {/* 検索とフィルター */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1">
          <form action="/wiki" method="get" className="flex">
            <div className="relative flex-1">
              <input
                type="text"
                name="search"
                placeholder="ページを検索..."
                defaultValue={currentSearch}
                className="w-full p-3 pr-10 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
            </div>
            
            {currentCategory && (
              <input type="hidden" name="category" value={currentCategory} />
            )}
            
            <button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-r-lg"
            >
              検索
            </button>
          </form>
        </div>
        
        <CategoryFilter 
          currentCategory={currentCategory}
          categories={result.categories}
          clearCategoryLink={getClearCategoryLink()}
          categoryBasePath={`/wiki?category=`}
        />
      </div>
      
      {/* 検索結果がない場合 */}
      {result.pages.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <div className="mb-4">
            <RefreshCw className="h-12 w-12 mx-auto text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">結果が見つかりません</h3>
          <p className="text-gray-600 mb-4">
            検索条件に一致するページがありませんでした。別のキーワードで検索するか、フィルターを解除してみてください。
          </p>
          <Link href="/wiki" className="text-blue-600 hover:underline">
            すべてのページを表示
          </Link>
        </div>
      )}
      
      {/* ページ一覧 */}
      {result.pages.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-200">
          {result.pages.map((page) => (
            <Link key={page.id} href={`/wiki/${page.id}`}>
              <div className="p-5 hover:bg-gray-50 transition-colors">
                <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                  <span className="px-2.5 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                    {page.category || '未分類'}
                  </span>
                  <span className="text-xs text-gray-500">
                    最終更新: {new Date(page.last_edited_time).toLocaleString('ja-JP', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <h2 className="text-xl font-semibold text-gray-800 hover:text-blue-600">{page.title}</h2>
                {page.authors && page.authors.length > 0 && (
                  <p className="text-sm text-gray-600 mt-1">
                    執筆者: {page.authors.join(', ')}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
      
      {/* ページネーション */}
      {result.totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <nav className="flex items-center space-x-1">
            {currentPage > 1 && (
              <Link
                href={generatePageLink(currentPage - 1)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                前へ
              </Link>
            )}
            
            {[...Array(result.totalPages)].map((_, i) => {
              const pageNum = i + 1;
              return (
                <Link
                  key={pageNum}
                  href={generatePageLink(pageNum)}
                  className={`px-4 py-2 border rounded-md ${
                    pageNum === currentPage
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </Link>
              );
            })}
            
            {currentPage < result.totalPages && (
              <Link
                href={generatePageLink(currentPage + 1)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                次へ
              </Link>
            )}
          </nav>
        </div>
      )}
    </div>
  );
} 