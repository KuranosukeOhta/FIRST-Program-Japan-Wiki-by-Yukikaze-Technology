import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, Loader2, AlertCircle, Tag, Calendar, ArrowLeft } from 'lucide-react';

interface NotionPage {
  id: string;
  properties: Record<string, any>;
  created_time: string;
  last_edited_time: string;
}

interface NotionData {
  results: NotionPage[];
}

function SearchResults() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams?.get('q') || '';
  
  const [pages, setPages] = useState<NotionPage[]>([]);
  const [searchResults, setSearchResults] = useState<NotionPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(query);
  
  // 初期検索クエリでデータをロード
  useEffect(() => {
    const fetchPages = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/notion`,
          {
            headers: {
              Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error('ページデータの取得に失敗しました');
        }

        const data: NotionData = await response.json();
        setPages(data.results);
        
        // 検索クエリに基づいてフィルタリング
        performSearch(data.results, query);
      } catch (err) {
        setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
      } finally {
        setLoading(false);
      }
    };

    if (query) {
      fetchPages();
    } else {
      setLoading(false);
      setSearchResults([]);
    }
  }, [query]);
  
  // 検索を実行する関数
  const performSearch = (allPages: NotionPage[], searchTerm: string) => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    
    // タイトルとプロパティで検索
    const results = allPages.filter(page => {
      // ページのプロパティが存在するかチェック
      if (!page.properties) return false;
      
      // タイトルを検索
      const titleProperty = Object.values(page.properties).find(
        (prop: any) => prop.type === 'title'
      );
      
      const title = titleProperty && titleProperty.title && titleProperty.title.length > 0
        ? titleProperty.title[0].plain_text.toLowerCase()
        : '';
        
      // 他のテキストプロパティを検索
      const otherTextProperties = Object.values(page.properties)
        .filter((prop: any) => prop.type === 'rich_text' && prop.rich_text && prop.rich_text.length > 0)
        .map((prop: any) => prop.rich_text[0].plain_text.toLowerCase())
        .join(' ');
      
      // どちらかに検索語が含まれていれば結果に含める
      return title.includes(lowerSearchTerm) || otherTextProperties.includes(lowerSearchTerm);
    });
    
    // 更新日時で降順にソート
    results.sort((a, b) => 
      new Date(b.last_edited_time).getTime() - new Date(a.last_edited_time).getTime()
    );
    
    setSearchResults(results);
  };
  
  // 新しい検索を実行する
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const getPageTitle = (page: NotionPage) => {
    // page.propertiesが存在するか確認
    if (!page.properties) return 'Untitled';

    const titleProperty = Object.values(page.properties).find(
      (prop: any) => prop.type === 'title'
    );
    
    if (titleProperty && titleProperty.title && titleProperty.title.length > 0) {
      return titleProperty.title[0].plain_text;
    }
    
    return 'Untitled';
  };

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
          <span className="mt-4 text-gray-600">検索中...</span>
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
        <Link href="/" className="inline-flex items-center mt-4 text-red-700 hover:text-red-800 font-medium">
          <ArrowLeft className="w-4 h-4 mr-1" />
          ホームに戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center text-indigo-600 hover:text-indigo-800">
          <ArrowLeft className="w-4 h-4 mr-1" />
          ホームに戻る
        </Link>
      </div>
      
      <h1 className="text-2xl font-bold text-gray-900">検索結果: {query}</h1>
      
      {/* 検索フォーム */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <form onSubmit={handleSearch} className="w-full">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="新しい検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>
      </div>
      
      {/* 検索結果 */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {query && (
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <p className="text-gray-600">
              「{query}」の検索結果: {searchResults.length}件
            </p>
          </div>
        )}
        
        {searchResults.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {searchResults.map((page) => {
              const title = getPageTitle(page);
              const category = getPageCategory(page);
              
              return (
                <li key={page.id} className="hover:bg-gray-50">
                  <Link href={`/page/${page.id}`} className="block p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-medium text-gray-900 truncate">{title}</h2>
                        <div className="mt-1 flex items-center text-sm text-gray-500">
                          {category && (
                            <span className="inline-flex items-center mr-3 px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                              <Tag className="w-3 h-3 mr-1" />
                              {category}
                            </span>
                          )}
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
          <div className="p-8 text-center text-gray-500">
            <p>「{query}」に一致するページが見つかりませんでした。</p>
            <Link href="/" className="mt-4 inline-flex items-center text-indigo-600 hover:text-indigo-800">
              <ArrowLeft className="w-4 h-4 mr-1" />
              ホームに戻る
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default SearchResults; 