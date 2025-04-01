import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Search, BookOpen, Tag, Home, List, Loader2, Bug, Download } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debugData, setDebugData] = useState<any>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const pathname = usePathname();

  // カテゴリー取得関数
  const fetchCategories = async () => {
    setLoadingCategories(true);
    setFetchError(null);
    
    try {
      console.log(`カテゴリー取得開始 (試行: ${retryCount + 1})`);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/notion/categories`,
        {
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          // キャッシュを無効化
          cache: 'no-store'
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('カテゴリー取得レスポンス:', data);
        
        // デバッグデータを保存
        setDebugData(data);
        
        // グローバルデバッグ機能があれば使用する
        if (window && (window as any).__debug && (window as any).__debug.saveDebugData) {
          (window as any).__debug.saveDebugData('categories', data);
        } else {
          // 通常のLocalStorageに保存
          localStorage.setItem('notion_debug_categories', JSON.stringify(data));
        }
        
        // コンソールに詳細ログを出力
        if (data.categories) {
          console.table(data.categories || []);
        } else {
          console.warn('カテゴリーデータが存在しません');
        }
        
        if (data.debug) {
          console.log('カテゴリー詳細:', data.debug.category_details);
          console.log('カテゴリー候補プロパティ:', data.debug.potential_category_properties);
        }
        
        // カテゴリーデータの処理
        if (Array.isArray(data.categories)) {
          setCategories(data.categories);
          console.log(`${data.categories.length}個のカテゴリーを設定しました`, data.categories);
          
          // 正常に処理できた場合は再試行カウンターをリセット
          setRetryCount(0);
        } else {
          console.error('カテゴリーデータが配列ではありません:', data.categories);
          // カテゴリーがundefinedの場合や配列でない場合は空の配列を設定
          setCategories([]);
          
          // 自動再試行のために再試行カウンターを増やす
          setRetryCount(prev => prev + 1);
          
          // エラーメッセージを設定
          setFetchError('カテゴリーデータの形式が正しくありません。再試行します...');
        }
      } else {
        const errorText = `カテゴリー取得エラー: ${response.status} ${response.statusText}`;
        console.error(errorText);
        setFetchError(errorText);
        
        // エラー時に再試行カウンターを増やす
        setRetryCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('カテゴリー取得エラー:', error);
      setFetchError(`カテゴリー取得中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`);
      
      // エラー時に再試行カウンターを増やす
      setRetryCount(prev => prev + 1);
    } finally {
      setLoadingCategories(false);
    }
  };

  // 初回読み込み時とリトライ時にカテゴリーを取得
  useEffect(() => {
    fetchCategories();
  }, []);
  
  // エラーが発生した場合は最大3回まで自動再試行
  useEffect(() => {
    if (fetchError && retryCount > 0 && retryCount < 4) {
      const timer = setTimeout(() => {
        console.log(`カテゴリー取得を再試行します (${retryCount}/3)...`);
        fetchCategories();
      }, 2000 * retryCount); // 徐々に再試行間隔を長くする
      
      return () => clearTimeout(timer);
    }
  }, [fetchError, retryCount]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  // モバイルでサイドバーを開いたときに本文のスクロールを防止
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [sidebarOpen]);

  // ページ遷移時にサイドバーを閉じる
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // カテゴリー再取得
  const refreshCategories = () => {
    fetchCategories();
  };

  // デバッグ情報をダウンロードする関数
  const downloadDebugData = () => {
    if (!debugData) return;
    
    const blob = new Blob([JSON.stringify(debugData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'notion_categories_debug.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          <div className="flex items-center">
            <button
              type="button"
              className="p-2 rounded-md text-gray-400 lg:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? (
                <X className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="h-6 w-6" aria-hidden="true" />
              )}
              <span className="sr-only">サイドバーを{sidebarOpen ? '閉じる' : '開く'}</span>
            </button>
            <Link href="/" className="flex items-center">
              <span className="ml-2 text-xl font-bold text-gray-900">FIRST Program Japan Wiki</span>
            </Link>
          </div>
          <div className="flex-1 flex justify-center px-2 lg:ml-6 lg:justify-end">
            <form onSubmit={handleSearch} className="max-w-lg w-full">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="検索"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </form>
          </div>
          {/* デバッグボタン */}
          <div className="flex items-center space-x-2">
            <button 
              onClick={refreshCategories} 
              className="p-2 text-gray-400 hover:text-gray-500"
              title="カテゴリーを再読み込み"
            >
              <Loader2 className={`h-5 w-5 ${loadingCategories ? 'animate-spin' : ''}`} />
            </button>
            <button 
              onClick={downloadDebugData} 
              className="p-2 text-gray-400 hover:text-gray-500"
              title="JSONをダウンロード"
            >
              <Download className="h-5 w-5" />
            </button>
            <button 
              onClick={() => setShowDebug(!showDebug)} 
              className="p-2 text-gray-400 hover:text-gray-500"
              title="デバッグ情報"
            >
              <Bug className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* デバッグ情報表示 */}
      {showDebug && (
        <div className="bg-gray-100 p-4 border-b border-gray-200">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">デバッグ情報</h3>
            <button 
              onClick={downloadDebugData}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              JSONをダウンロード
            </button>
          </div>
          
          {fetchError && (
            <div className="bg-red-100 text-red-800 p-2 mb-2 rounded text-sm">
              {fetchError}
              {retryCount > 0 && retryCount < 4 && (
                <span className="ml-2">
                  再試行中 ({retryCount}/3)...
                </span>
              )}
            </div>
          )}
          
          <div className="bg-white p-2 rounded text-xs font-mono overflow-auto max-h-80">
            {debugData ? (
              <pre>{JSON.stringify(debugData, null, 2)}</pre>
            ) : (
              <span className="text-gray-500">データなし</span>
            )}
          </div>
        </div>
      )}

      {/* メインコンテンツ */}
      <div className="flex-1 flex">
        {/* オーバーレイ */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        {/* サイドバー */}
        <aside
          className={`fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="h-full flex flex-col overflow-y-auto">
            <div className="flex-shrink-0 p-4 flex items-center">
              <span className="text-lg font-bold text-gray-900">メニュー</span>
            </div>
            <nav className="flex-1 p-4 space-y-2">
              <Link
                href="/"
                className="flex items-center px-3 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-md"
              >
                <Home className="h-5 w-5 mr-3" />
                ホーム
              </Link>
              <Link
                href="/wiki"
                className="flex items-center px-3 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-md"
              >
                <BookOpen className="h-5 w-5 mr-3" />
                ウィキページ一覧
              </Link>
              
              {/* カテゴリーリスト */}
              <div className="mt-6">
                <div className="px-3 mb-2 text-sm font-semibold text-gray-600 flex items-center justify-between">
                  <span className="flex items-center">
                    <Tag className="h-4 w-4 mr-2 text-gray-500" />
                    カテゴリー
                  </span>
                  {loadingCategories ? (
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  ) : (
                    <span className="text-xs text-gray-400">{categories.length}件</span>
                  )}
                </div>
                
                {fetchError && retryCount >= 4 && (
                  <div className="mt-2 mb-3 px-3 text-xs text-red-600">
                    カテゴリーの読み込みに失敗しました。
                    <button 
                      onClick={refreshCategories}
                      className="text-indigo-600 hover:text-indigo-800 ml-1"
                    >
                      再試行
                    </button>
                  </div>
                )}
                
                <div className="space-y-1">
                  {categories.length > 0 ? (
                    categories.map((category) => (
                      <Link
                        key={category}
                        href={`/category/${encodeURIComponent(category)}`}
                        className="block px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-md"
                      >
                        {category}
                      </Link>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-gray-500">
                      {loadingCategories ? 'ロード中...' : 'カテゴリーがありません'}
                    </div>
                  )}
                </div>
              </div>
              
              {/* その他のリンク */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <Link
                  href="/about"
                  className="flex items-center px-3 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-md"
                >
                  <List className="h-5 w-5 mr-3" />
                  このWikiについて
                </Link>
                {/* 後から追加したいリンクがある場合はここに追加 */}
              </div>
            </nav>
          </div>
        </aside>

        {/* メインコンテンツエリア */}
        <main className="flex-1 overflow-auto p-4 lg:p-8">
          <div className="max-w-4xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default Layout; 