import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Loader2, Filter, ArrowUpDown, Tag, Calendar, AlertCircle } from 'lucide-react';

interface NotionPage {
  id: string;
  properties: Record<string, any>;
  created_time: string;
  last_edited_time: string;
}

interface NotionData {
  results: NotionPage[];
}

function AllPages() {
  const [pages, setPages] = useState<NotionPage[]>([]);
  const [filteredPages, setFilteredPages] = useState<NotionPage[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // フィルタリングと検索の状態
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [sortField, setSortField] = useState<'title' | 'updated' | 'created'>('updated');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const fetchPages = async () => {
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
        
        // カテゴリーの一覧を抽出
        const uniqueCategories = new Set<string>();
        data.results.forEach(page => {
          const category = getPageCategory(page);
          if (category) {
            uniqueCategories.add(category);
          }
        });
        
        setCategories(Array.from(uniqueCategories).sort());
      } catch (err) {
        setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
      } finally {
        setLoading(false);
      }
    };

    fetchPages();
  }, []);

  // 検索やフィルターが変更されたときにページをフィルタリング
  useEffect(() => {
    if (!pages.length) return;
    
    let result = [...pages];
    
    // カテゴリーでフィルタリング
    if (selectedCategory) {
      result = result.filter(page => {
        return getPageCategory(page) === selectedCategory;
      });
    }
    
    // 検索クエリでフィルタリング
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(page => {
        // タイトルで検索
        const titleProperty = Object.values(page.properties).find(
          (prop: any) => prop.type === 'title'
        );
        const title = titleProperty && titleProperty.title && titleProperty.title.length > 0
          ? titleProperty.title[0].plain_text.toLowerCase()
          : '';
          
        // 他のプロパティで検索（必要に応じて追加）
        return title.includes(lowerQuery);
      });
    }
    
    // ソート
    result.sort((a, b) => {
      if (sortField === 'title') {
        const titleA = getPageTitle(a).toLowerCase();
        const titleB = getPageTitle(b).toLowerCase();
        return sortDirection === 'asc' 
          ? titleA.localeCompare(titleB)
          : titleB.localeCompare(titleA);
      } else if (sortField === 'created') {
        const dateA = new Date(a.created_time).getTime();
        const dateB = new Date(b.created_time).getTime();
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      } else { // updated
        const dateA = new Date(a.last_edited_time).getTime();
        const dateB = new Date(b.last_edited_time).getTime();
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      }
    });
    
    setFilteredPages(result);
  }, [pages, searchQuery, selectedCategory, sortField, sortDirection]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Tokyo'
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

  const toggleSort = (field: 'title' | 'updated' | 'created') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc'); // デフォルトは降順
    }
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
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">全ページ一覧</h1>
      
      {/* 検索とフィルタリング */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 検索ボックス */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="ページを検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {/* カテゴリーフィルター */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-5 w-5 text-gray-400" />
            </div>
            <select
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">すべてのカテゴリー</option>
              {categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          
          {/* ソートオプション */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">並び替え:</span>
            <button
              onClick={() => toggleSort('title')}
              className={`px-3 py-1 rounded-md text-sm ${
                sortField === 'title'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              タイトル
              {sortField === 'title' && (
                <span className="ml-1">
                  {sortDirection === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </button>
            <button
              onClick={() => toggleSort('updated')}
              className={`px-3 py-1 rounded-md text-sm ${
                sortField === 'updated'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              更新日
              {sortField === 'updated' && (
                <span className="ml-1">
                  {sortDirection === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </button>
            <button
              onClick={() => toggleSort('created')}
              className={`px-3 py-1 rounded-md text-sm ${
                sortField === 'created'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              作成日
              {sortField === 'created' && (
                <span className="ml-1">
                  {sortDirection === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* ページ一覧 */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {filteredPages.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {filteredPages.map((page) => {
              const title = getPageTitle(page);
              const category = getPageCategory(page);
              
              return (
                <li key={page.id} className="hover:bg-gray-50">
                  <Link href={`/wiki/${page.id}`} className="block p-4">
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
          <div className="p-6 text-center text-gray-500">
            {searchQuery || selectedCategory ? (
              <p>検索条件に一致するページが見つかりませんでした。</p>
            ) : (
              <p>ページがありません。</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AllPages; 