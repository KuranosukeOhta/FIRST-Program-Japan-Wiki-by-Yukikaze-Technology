import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader2, ArrowLeft, Tag, Calendar, AlertCircle, ArrowUpDown } from 'lucide-react';

interface NotionPage {
  id: string;
  properties: Record<string, any>;
  created_time: string;
  last_edited_time: string;
}

interface NotionData {
  results: NotionPage[];
}

function CategoryPages() {
  const { categoryName } = useParams<{ categoryName: string }>();
  const [pages, setPages] = useState<NotionPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  const decodedCategoryName = categoryName ? decodeURIComponent(categoryName) : '';

  useEffect(() => {
    const fetchPages = async () => {
      try {
        // 全ページを取得してフロントエンドでフィルタリング
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notion`,
          {
            headers: {
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error('ページデータの取得に失敗しました');
        }

        const data: NotionData = await response.json();
        
        // カテゴリーでフィルタリング
        const filteredPages = data.results.filter(page => {
          // カテゴリープロパティを取得（さまざまな形式に対応）
          if (!page.properties) return false;
          
          // 既存のプロパティ名でチェック
          const categoryProperty = page.properties.Category || page.properties.カテゴリー;
          if (categoryProperty?.select?.name === decodedCategoryName) {
            return true;
          }
          
          // プロパティを走査してselect/multi_selectタイプを探す
          return Object.values(page.properties).some(prop => {
            if ((prop as any).type === 'select' && (prop as any).select?.name === decodedCategoryName) {
              return true;
            }
            if ((prop as any).type === 'multi_select') {
              return (prop as any).multi_select?.some((item: any) => item.name === decodedCategoryName);
            }
            return false;
          });
        });
        
        // 更新日でソート
        sortPages(filteredPages);
        
        setPages(filteredPages);
      } catch (err) {
        setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
      } finally {
        setLoading(false);
      }
    };

    if (decodedCategoryName) {
      fetchPages();
    }
  }, [decodedCategoryName]);

  // 並び替え関数
  const sortPages = (pageList: NotionPage[]) => {
    pageList.sort((a, b) => {
      const dateA = new Date(a.last_edited_time).getTime();
      const dateB = new Date(b.last_edited_time).getTime();
      return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
    });
    return pageList;
  };

  // 並び替え方向を切り替える
  const toggleSortDirection = () => {
    const newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    setSortDirection(newDirection);
    // 既存のページを新しい順序で並び替え
    setPages([...sortPages([...pages])]);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPageTitle = (page: NotionPage) => {
    // page.propertiesが存在するか確認
    if (!page.properties) return 'Untitled';

    // タイトルプロパティを特定
    const titleProperty = Object.values(page.properties).find(
      (prop: any) => prop.type === 'title'
    );
    
    if (titleProperty && titleProperty.title && titleProperty.title.length > 0) {
      return titleProperty.title[0].plain_text;
    }
    
    return 'Untitled';
  };

  // カテゴリーを取得する関数
  const getPageCategory = (page: NotionPage): string | null => {
    // page.propertiesが存在するか確認
    if (!page.properties) return null;

    // 既存のプロパティ名でチェック
    const categoryProperty = page.properties.Category || page.properties.カテゴリー;
    if (categoryProperty?.select?.name) {
      return categoryProperty.select.name;
    }
    
    // プロパティを走査してselectタイプを探す
    for (const prop of Object.values(page.properties)) {
      if ((prop as any).type === 'select' && (prop as any).select?.name) {
        return (prop as any).select.name;
      }
    }
    
    // multi_selectの場合は最初の値を返す
    for (const prop of Object.values(page.properties)) {
      if ((prop as any).type === 'multi_select' && (prop as any).multi_select?.length > 0) {
        return (prop as any).multi_select[0].name;
      }
    }
    
    return null;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
          <span className="mt-4 text-gray-600">ページを読み込み中...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
        <div className="flex items-center mb-3">
          <AlertCircle className="w-6 h-6 mr-2" />
          <h3 className="text-lg font-medium">エラーが発生しました</h3>
        </div>
        <p>{error}</p>
        <Link to="/" className="inline-flex items-center mt-4 text-red-700 hover:text-red-800 font-medium">
          <ArrowLeft className="w-4 h-4 mr-1" />
          ホームに戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/" className="inline-flex items-center text-indigo-600 hover:text-indigo-800 mb-2">
            <ArrowLeft className="w-4 h-4 mr-1" />
            ホームに戻る
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Tag className="w-5 h-5 mr-2 text-indigo-500" />
            カテゴリー: {decodedCategoryName}
          </h1>
        </div>
        
        <button
          onClick={toggleSortDirection}
          className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center text-sm"
        >
          <Calendar className="w-4 h-4 mr-1" />
          更新日 {sortDirection === 'asc' ? '（古い順）' : '（新しい順）'}
          <span className="ml-1">
            {sortDirection === 'asc' ? '↑' : '↓'}
          </span>
        </button>
      </div>
      
      {/* ページ一覧 */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {pages.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {pages.map((page) => {
              const title = getPageTitle(page);
              
              return (
                <li key={page.id} className="hover:bg-gray-50">
                  <Link to={`/page/${page.id}`} className="block p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-medium text-gray-900 truncate">{title}</h2>
                        <div className="mt-1 flex items-center text-sm text-gray-500">
                          <span className="inline-flex items-center mr-3">
                            <Calendar className="w-4 h-4 mr-1" />
                            {formatDate(page.last_edited_time)}
                          </span>
                        </div>
                      </div>
                      <div className="mt-1">
                        <svg
                          className="h-5 w-5 text-gray-400"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="p-6 text-center text-gray-500">
            <p>このカテゴリーにはページがありません。</p>
            <Link to="/all-pages" className="inline-flex items-center mt-4 text-indigo-600 hover:text-indigo-800 font-medium">
              全ページ一覧を見る
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default CategoryPages; 