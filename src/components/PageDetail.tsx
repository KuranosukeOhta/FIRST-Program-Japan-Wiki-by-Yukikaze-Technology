import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Calendar, ArrowLeft, Tag, Clock, AlertCircle } from 'lucide-react';
import NotionContent from './NotionContent';
import { CustomLoader, ProgressLoading } from '../components/Loading';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface BlockContent {
  id: string;
  type: string;
  [key: string]: any;
}

interface NotionPage {
  id: string;
  properties: Record<string, any>;
  created_time: string;
  last_edited_time: string;
}

// Loadingコンポーネントを内部で定義
const Loading = ({ message }: { message: string }) => (
  <div className="flex justify-center items-center h-64">
    <div className="flex flex-col items-center">
      <CustomLoader message={message} size="large" />
    </div>
  </div>
);

function PageDetail() {
  const params = useParams();
  const pageId = params?.id as string;
  const [page, setPage] = useState<any>(null);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(true);
  const [jsonCopied, setJsonCopied] = useState(false);
  const [fetchRecursive, setFetchRecursive] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState<boolean>(false);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [rawApiResponse, setRawApiResponse] = useState<{
    pageResponse?: any;
    blocksResponse?: any;
    pageError?: any;
    blocksError?: any;
    directNotionResponse?: any;
    directNotionError?: any;
  }>({});
  const [requestState, setRequestState] = useState<{
    pageRequestStarted?: Date;
    pageRequestEnded?: Date;
    blocksRequestStarted?: Date;
    blocksRequestEnded?: Date;
    pageStatus?: number;
    blocksStatus?: number;
    blockCount?: number;
    corsCheck?: string;
    requestUrl?: string;
    directApiRequestUrl?: string;
  }>({});
  const [isSyncing, setIsSyncing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!pageId) return;

    setLoading(true);
    setError(null);
    setLoadingTimeout(false);
    setRequestState({});
    
    // 30秒のタイムアウトタイマーを設定
    const mainTimeoutId = setTimeout(() => {
      setLoadingTimeout(true);
    }, 30000);

    // ページデータとブロックデータを並行して取得
    const fetchData = async () => {
      try {
        await fetchPageData();
        await fetchBlocksData();
      } catch (err: any) {
        console.error('データ取得中にエラーが発生しました:', err);
        // エラー状態を確実に設定
        setError(err.message || 'データ取得中に予期しないエラーが発生しました');
        setLoading(false);
      }
    };

    fetchData().catch((err: any) => {
      console.error('fetchData内でキャッチされなかったエラー:', err);
      setError(err.message || '不明なエラーが発生しました');
      setLoading(false);
    });

    return () => {
      clearTimeout(mainTimeoutId); // コンポーネントがアンマウントされたときにもタイマーをクリア
    };
  }, [pageId]);

  // ページデータの取得を開始
  const fetchPageData = async () => {
    try {
      // クエリパラメータにタイムスタンプを追加してキャッシュを無効化
      const timestamp = new Date().getTime();
      
      // Supabase REST APIを使用してデータベースから直接取得
      const requestUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/notion_pages?id=eq.${pageId}&select=*`;
      console.log(`ページデータを取得: ${requestUrl}`);
      setRequestState(prev => ({ 
        ...prev, 
        pageRequestStarted: new Date(),
        requestUrl: requestUrl
      }));
      
      try {
        const pageResponse = await fetch(
          requestUrl,
          {
            headers: {
              'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
              'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}`,
              'Cache-Control': 'no-cache',
              'Content-Type': 'application/json'
            }
          }
        );
        
        setLoadingProgress(40);
        setRequestState(prev => ({ 
          ...prev, 
          pageRequestEnded: new Date(),
          pageStatus: pageResponse.status 
        }));

        // レスポンステキストをクローンして保存
        const responseClone = pageResponse.clone();
        const responseText = await responseClone.text();
        try {
          const responseJson = JSON.parse(responseText);
          setRawApiResponse(prev => ({ ...prev, pageResponse: responseJson }));
        } catch (e) {
          setRawApiResponse(prev => ({ ...prev, pageResponse: responseText }));
        }

        if (!pageResponse.ok) {
          throw new Error(`ページデータの取得に失敗しました (${pageResponse.status}): ${responseText}`);
        }

        // Supabaseはデータを配列で返すため、最初の要素を取得
        const pagesData = JSON.parse(responseText);
        if (!pagesData || pagesData.length === 0) {
          throw new Error('ページが見つかりません');
        }
        
        // 最初のページデータを使用（Notionページは一意のIDを持つため、常に1つだけのはず）
        const pageData = pagesData[0];
        console.log('Page data received:', pageData);
        
        // ページデータをセット
        setPage(pageData);
      } catch (err: any) {
        handlePageError(err);
        throw err; // 上位の関数にエラーを伝播
      }
      
      setLoadingProgress(50);
    } catch (err: any) {
      handlePageError(err);
      throw err; // 上位の関数にエラーを伝播
    }
  };
  
  // エラー処理を共通化
  const handlePageError = (err: any, timeoutId?: ReturnType<typeof setTimeout>) => {
    console.error('ページデータの取得中にエラーが発生しました:', err);
    
    if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
      setError('ネットワークエラー: サーバーに接続できません。インターネット接続を確認するか、しばらく経ってから再試行してください。');
    } else if (err.name === 'AbortError') {
      setError('タイムアウト: リクエストが完了する前に時間切れになりました。サーバーの応答が遅いか、接続が不安定である可能性があります。');
    } else {
      setError(err.message || 'ページデータの取得中に予期しないエラーが発生しました');
    }
    
    if (timeoutId) clearTimeout(timeoutId);
    
    // エラー時にもCORSが原因かどうかをチェック
    checkCORS();
  };
  
  // CORSが有効かどうかを確認
  const checkCORS = async () => {
    try {
      const corsCheck = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/ping?t=${new Date().getTime()}`, {
        method: 'OPTIONS'
      });
      console.log('CORS check result:', corsCheck.status, corsCheck.ok);
      setRequestState(prev => ({ ...prev, corsCheck: corsCheck.ok ? 'OK' : 'Failed' }));
    } catch (err) {
      console.error('CORS check failed:', err);
      setRequestState(prev => ({ ...prev, corsCheck: 'Error' }));
    }
  };

  // ブロックデータを取得する関数
  const fetchBlocksData = async () => {
    try {
      setLoadingProgress(50);
      setRequestState(prev => ({ ...prev, blocksRequestStarted: new Date() }));
      
      // ローカルストレージにキャッシュされたブロックがあるか確認
      const cachedBlocks = localStorage.getItem(`blocks_${pageId}`);
      const useCache = localStorage.getItem('use_cached_data') === 'true';
      
      if (useCache && cachedBlocks) {
        try {
          console.log('Using cached blocks from localStorage');
          const parsedBlocks = JSON.parse(cachedBlocks);
          setBlocks(parsedBlocks);
          setRequestState(prev => ({ 
            ...prev, 
            blockCount: parsedBlocks.length || 0,
            blocksRequestEnded: new Date(),
            blocksStatus: 200,
            fromCache: true
          }));
          setLoadingProgress(100);
          setLoading(false); // キャッシュからのロード完了時に確実にローディング状態を解除
          return;
        } catch (cacheErr) {
          console.error('Failed to parse cached blocks:', cacheErr);
        }
      }
      
      // Supabase REST APIを使用してデータベースから直接取得
      const requestUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/notion_blocks?page_id=eq.${pageId}&order=sort_order.asc&select=*`;
      
      console.log(`ブロックデータを取得: ${requestUrl}`);
      
      const blocksResponse = await fetch(
        requestUrl,
        {
          headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}`,
            'Cache-Control': 'no-cache',
            'Content-Type': 'application/json'
          }
        }
      );

      setLoadingProgress(80);
      setRequestState(prev => ({ 
        ...prev, 
        blocksRequestEnded: new Date(),
        blocksStatus: blocksResponse.status 
      }));

      if (!blocksResponse.ok) {
        const errorText = await blocksResponse.text();
        throw new Error(`ページブロックの取得に失敗しました (${blocksResponse.status}): ${errorText}`);
      }

      const blocksData = await blocksResponse.json();
      console.log('Blocks data received:', blocksData);
      
      // コンテンツフィールドから実際のブロックデータを抽出
      const formattedBlocks = blocksData.map((block: any) => block.content);
      
      // ブロックデータを設定
      setBlocks(formattedBlocks);
      
      // キャッシュを更新
      try {
        localStorage.setItem(`blocks_${pageId}`, JSON.stringify(formattedBlocks));
      } catch (cacheErr) {
        console.error('Failed to cache blocks:', cacheErr);
      }
      
      setRequestState(prev => ({ 
        ...prev, 
        blockCount: formattedBlocks.length || 0
      }));
      
      setLoadingProgress(100);
      setLoading(false);
    } catch (err: any) {
      console.error('ブロックデータの取得中にエラーが発生しました:', err);
      setError(err.message || 'ページブロックの取得中に予期しないエラーが発生しました');
      setLoading(false);
    }
  };

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

  const getPageTitle = () => {
    if (!page || !page.properties) return 'Untitled';

    const titleProp = page.properties.title || 
                     page.properties['ページタイトル'] || 
                     page.properties.Name;
    
    if (titleProp?.title && titleProp.title.length > 0) {
      return titleProp.title[0].plain_text;
    }

    return 'Untitled';
  };

  // ページタイトルが取得できたらdocument.titleを更新
  useEffect(() => {
    const title = getPageTitle();
    if (title !== 'Untitled') {
      document.title = `${title} | FIRST Program Japan Wiki`;
    }
    return () => {
      // コンポーネントのアンマウント時にタイトルをリセット
      document.title = 'FIRST Program Japan Wiki';
    };
  }, [page]);

  const getPageCategory = () => {
    if (!page || !page.properties) return null;

    // カテゴリーフィールドを探索
    const categoryProps = ['Category', 'カテゴリー', 'カテゴリ'];
    
    for (const propName of categoryProps) {
      const prop = page.properties[propName];
      if (prop && prop.type === 'select' && prop.select) {
        return prop.select.name;
      }
    }

    // すべてのプロパティを確認
    for (const key in page.properties) {
      const prop = page.properties[key];
      if (prop.type === 'select' && prop.select) {
        return prop.select.name;
      }
    }

    return null;
  };

  // コンテンツをJSONとしてコピーする関数
  const copyContentAsJson = () => {
    try {
      const contentJson = JSON.stringify(blocks, null, 2);
      navigator.clipboard.writeText(contentJson);
      setJsonCopied(true);
      setTimeout(() => setJsonCopied(false), 2000); // 2秒後に通知を消す
    } catch (err) {
      console.error('JSONのコピーに失敗しました:', err);
    }
  };

  // ページデータを含むすべての情報をJSONとしてコピーする
  const copyFullJson = () => {
    try {
      const fullData = {
        page: page,
        blocks: blocks
      };
      const fullJson = JSON.stringify(fullData, null, 2);
      navigator.clipboard.writeText(fullJson);
      setJsonCopied(true);
      setTimeout(() => setJsonCopied(false), 2000);
    } catch (err) {
      console.error('JSONのコピーに失敗しました:', err);
    }
  };

  // 再帰的にブロックを取得する
  const toggleRecursiveFetch = () => {
    setFetchRecursive(!fetchRecursive);
  };

  // Notionから直接ブロックデータを取得（実験的機能）
  const fetchDirectFromNotion = async () => {
    try {
      setLoadingProgress(10);
      setRequestState(prev => ({ ...prev, directApiRequestStarted: new Date() }));
      
      // エラーが発生しない単純なNotionブロック取得API
      const directApiRequestUrl = `/api/notion-blocks?pageId=${pageId}`;
      
      console.log(`Notionから直接ブロックを取得: ${directApiRequestUrl}`);
      
      const directResponse = await fetch(directApiRequestUrl);
      
      setLoadingProgress(50);
      
      // レスポンスのクローンを保存
      const directResponseClone = directResponse.clone();
      let responseText = '';
      try {
        responseText = await directResponseClone.text();
        const responseJson = JSON.parse(responseText);
        setRawApiResponse(prev => ({ ...prev, directNotionResponse: responseJson }));
      } catch (e) {
        setRawApiResponse(prev => ({ ...prev, directNotionResponse: responseText }));
      }
      
      if (!directResponse.ok) {
        throw new Error(`Notionからの直接取得に失敗しました (${directResponse.status}): ${responseText}`);
      }
      
      setLoadingProgress(80);
      
      // JSONレスポンスを解析
      const data = JSON.parse(responseText);
      if (data.blocks) {
        console.log(`${data.blocks.length}個のブロックを取得しました`);
        setBlocks(data.blocks);
        setRequestState(prev => ({ 
          ...prev, 
          blockCount: data.blocks.length,
          directApiRequestEnded: new Date()
        }));
        setLoading(false);
      } else {
        throw new Error('Notionからのレスポンスに有効なブロックデータがありません');
      }
      
      setLoadingProgress(100);
    } catch (err: any) {
      console.error('Notionからの直接取得中にエラーが発生しました:', err);
      setError(err.message || 'Notionからのデータ取得に失敗しました');
      setRawApiResponse(prev => ({ ...prev, directNotionError: err.message }));
      setLoading(false);
    }
  };

  const title = getPageTitle();
  const category = getPageCategory();

  const handleSyncClick = async () => {
    try {
      setIsSyncing(true);
      const response = await fetch('/api/sync-notion');
      const data = await response.json();

      if (response.headers.get('X-Clear-Cache') === 'true') {
        // 同期完了後にキャッシュをクリア
        clearAllPageCache();
        clearAllBlocksCache();
        console.log('Cache cleared after sync');
      }

      if (data.success) {
        toast.success('同期が完了しました');
        // 同期後にページを再読み込み
        router.refresh();
      } else {
        toast.error('同期中にエラーが発生しました');
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('同期中にエラーが発生しました');
    } finally {
      setIsSyncing(false);
    }
  };

  // キャッシュクリアのユーティリティ関数
  const clearAllPageCache = () => {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('page_')) {
        localStorage.removeItem(key);
      }
    });
  };

  const clearAllBlocksCache = () => {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('blocks_')) {
        localStorage.removeItem(key);
      }
    });
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <div className="flex flex-col items-center">
          <ProgressLoading 
            progress={loadingProgress} 
            message={`ページデータを読み込んでいます (${loadingProgress}%)...`} 
          />
          
          {loadingTimeout && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-300 rounded-md">
              <p className="text-yellow-700">
                <AlertCircle className="inline-block mr-2" size={16} />
                読み込みに時間がかかっています。サーバーの応答が遅いか、データ量が多い可能性があります。
              </p>
            </div>
          )}

          {/* デバッグ情報をここに表示 - 常に表示 */}
          <div className="w-full mt-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
            <h3 className="font-bold text-lg mb-2">APIリクエスト情報</h3>
            
            <div className="mb-4">
              <h4 className="font-medium">基本情報:</h4>
              <div className="text-sm font-mono bg-white p-2 rounded border">
                <div><span className="font-bold">ページID:</span> {pageId}</div>
                <div><span className="font-bold">Supabase URL:</span> {process.env.NEXT_PUBLIC_SUPABASE_URL}</div>
                <div><span className="font-bold">Anon Key:</span> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '設定済み' : '未設定'}</div>
                <div><span className="font-bold">リクエストURL:</span> {requestState.requestUrl}</div>
              </div>
            </div>
            
            <div className="mb-4">
              <h4 className="font-medium">リクエスト状態:</h4>
              <div className="text-sm font-mono bg-white p-2 rounded border">
                {requestState.pageRequestStarted && (
                  <div><span className="font-bold">ページリクエスト開始:</span> {requestState.pageRequestStarted.toISOString()}</div>
                )}
                {requestState.pageRequestEnded && (
                  <div><span className="font-bold">ページリクエスト完了:</span> {requestState.pageRequestEnded.toISOString()}</div>
                )}
                {requestState.pageStatus && (
                  <div><span className="font-bold">ページレスポンスステータス:</span> {requestState.pageStatus}</div>
                )}
                {requestState.blocksRequestStarted && (
                  <div><span className="font-bold">ブロックリクエスト開始:</span> {requestState.blocksRequestStarted.toISOString()}</div>
                )}
                {requestState.blocksRequestEnded && (
                  <div><span className="font-bold">ブロックリクエスト完了:</span> {requestState.blocksRequestEnded.toISOString()}</div>
                )}
                {requestState.blocksStatus && (
                  <div><span className="font-bold">ブロックレスポンスステータス:</span> {requestState.blocksStatus}</div>
                )}
                {requestState.corsCheck && (
                  <div><span className="font-bold">CORS確認結果:</span> {requestState.corsCheck}</div>
                )}
              </div>
            </div>
            
            {/* APIレスポンスの生データを表示 */}
            <div className="mb-4">
              <h4 className="font-medium">APIレスポンス (生データ):</h4>
              <div className="text-sm overflow-auto max-h-64">
                {rawApiResponse.pageResponse ? (
                  <pre className="bg-white p-2 rounded border whitespace-pre-wrap">
                    {JSON.stringify(rawApiResponse.pageResponse, null, 2)}
                  </pre>
                ) : rawApiResponse.pageError ? (
                  <pre className="bg-red-50 p-2 rounded border border-red-200 text-red-700 whitespace-pre-wrap">
                    エラー: {rawApiResponse.pageError}
                  </pre>
                ) : (
                  <p className="italic">レスポンスデータなし</p>
                )}
              </div>
            </div>
            
            {/* 直接Notion APIのレスポンスを表示（デバッグ用） */}
            {(rawApiResponse.directNotionResponse || rawApiResponse.directNotionError) && (
              <div className="mb-4">
                <h4 className="font-medium">Notion API 直接アクセス結果:</h4>
                <div className="text-sm overflow-auto max-h-64">
                  {rawApiResponse.directNotionResponse ? (
                    <pre className="bg-white p-2 rounded border whitespace-pre-wrap">
                      {JSON.stringify(rawApiResponse.directNotionResponse, null, 2)}
                    </pre>
                  ) : rawApiResponse.directNotionError ? (
                    <pre className="bg-red-50 p-2 rounded border border-red-200 text-red-700 whitespace-pre-wrap">
                      エラー: {rawApiResponse.directNotionError}
                    </pre>
                  ) : null}
                </div>
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              <button 
                onClick={() => window.location.reload()} 
                className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
              >
                ページを再読み込み
              </button>
              <button
                onClick={async () => {
                  try {
                    // CORSチェック
                    await checkCORS();
                    alert('CORS確認実行しました。詳細は表示エリアを確認してください。');
                  } catch (err: any) {
                    alert(`CORS確認エラー: ${err.message}`);
                  }
                }}
                className="px-3 py-1 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 text-sm"
              >
                CORS確認
              </button>
              
              {/* デバッグ用に直接NotionAPIにアクセスするボタン */}
              <button
                onClick={fetchDirectFromNotion}
                className="px-3 py-1 bg-pink-100 border border-pink-300 rounded-md hover:bg-pink-200 text-sm text-pink-700"
              >
                直接Notion APIテスト (デバッグ用)
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto p-4 bg-red-50 rounded-md my-8 border border-red-300">
        <h1 className="text-xl font-bold text-red-700 mb-2">エラーが発生しました</h1>
        <p className="text-red-600">{error}</p>
        
        <div className="mt-4 flex gap-2">
          <button 
            onClick={() => window.location.reload()} 
            className="px-3 py-1 bg-white border border-red-300 rounded-md hover:bg-red-50 text-sm text-red-700"
          >
            ページを再読み込み
          </button>
          <button
            onClick={async () => {
              try {
                // Supabase接続テスト
                const testResponse = await fetch(
                  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/notion/categories`,
                  {
                    headers: {
                      Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
                    },
                  }
                );
                
                if (testResponse.ok) {
                  const data = await testResponse.json();
                  alert(`Supabase Functions 接続成功！\nカテゴリー: ${data.categories?.join(', ') || 'なし'}`);
                } else {
                  alert(`Supabase Functions 接続エラー: ${testResponse.status} ${testResponse.statusText}`);
                }
              } catch (err: any) {
                console.error('接続テストエラー:', err);
                alert(`接続テストエラー: ${err.message}`);
              }
            }}
            className="px-3 py-1 bg-blue-50 border border-blue-300 rounded-md hover:bg-blue-100 text-sm text-blue-700"
          >
            サーバー接続テスト
          </button>
        </div>
        
        <details className="mt-4 p-3 bg-red-100 rounded text-sm">
          <summary className="cursor-pointer font-medium">デバッグ情報</summary>
          <div className="mt-2 font-mono text-xs overflow-auto">
            <div><span className="font-bold">ページID:</span> {pageId}</div>
            <div><span className="font-bold">Supabase URL:</span> {process.env.NEXT_PUBLIC_SUPABASE_URL}</div>
            <div><span className="font-bold">Supabase Key:</span> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '設定済み' : '未設定'}</div>
            {requestState.pageRequestStarted && (
              <div><span className="font-bold">ページリクエスト開始:</span> {requestState.pageRequestStarted.toISOString()}</div>
            )}
            {requestState.pageRequestEnded && (
              <div><span className="font-bold">ページリクエスト完了:</span> {requestState.pageRequestEnded.toISOString()}</div>
            )}
            {requestState.pageStatus && (
              <div><span className="font-bold">ページレスポンスステータス:</span> {requestState.pageStatus}</div>
            )}
            {requestState.blocksRequestStarted && (
              <div><span className="font-bold">ブロックリクエスト開始:</span> {requestState.blocksRequestStarted.toISOString()}</div>
            )}
            {requestState.blocksRequestEnded && (
              <div><span className="font-bold">ブロックリクエスト完了:</span> {requestState.blocksRequestEnded.toISOString()}</div>
            )}
            {requestState.blocksStatus && (
              <div><span className="font-bold">ブロックレスポンスステータス:</span> {requestState.blocksStatus}</div>
            )}
            {requestState.blockCount !== undefined && (
              <div><span className="font-bold">ブロック数:</span> {requestState.blockCount}</div>
            )}
          </div>
        </details>
        
        <Link href="/" className="inline-flex items-center mt-4 text-red-700 hover:text-red-800 font-medium">
          ← ホームに戻る
        </Link>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="max-w-3xl mx-auto p-4 bg-yellow-50 rounded-md my-8 border border-yellow-300">
        <h1 className="text-xl font-bold text-yellow-700 mb-2">ページが見つかりません</h1>
        <p className="text-yellow-600">指定されたIDのページは存在しないか、アクセスできません。</p>
        <Link href="/" className="inline-flex items-center mt-4 text-yellow-700 hover:text-yellow-800 font-medium">
          ← ホームに戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="pb-16">
      {/* 戻るボタン */}
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="inline-flex items-center text-gray-600 hover:text-gray-800">
          <ArrowLeft className="w-4 h-4 mr-2" />
          ホームに戻る
        </Link>
        
        <div className="flex space-x-2">
          <Link href={`/category/${getPageCategory() || 'すべて'}`} className="text-blue-600 hover:text-blue-800">
            カテゴリに戻る
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto py-8 px-4">
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-4">{title}</h1>
          {category && (
            <div className="text-sm text-gray-600 mb-2">
              カテゴリー: <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">{category}</span>
            </div>
          )}
          <div className="text-sm text-gray-500">
            最終更新: {formatDate(page.last_edited_time)}
          </div>
        </header>

        <article className="prose max-w-none">
          {blocks && blocks.length > 0 ? (
            <NotionContent blocks={blocks} />
          ) : (
            <div className="bg-gray-50 p-4 rounded border border-gray-200">
              <p className="text-gray-600">ブロックデータが取得できませんでした。以下は生のページデータです：</p>
              <div className="mt-2 p-3 bg-white rounded border border-gray-300 overflow-auto max-h-96">
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify(page, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </article>

        <div className="mt-8 pt-4 border-t border-gray-200">
          <button 
            onClick={() => setShowDebug(!showDebug)} 
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            {showDebug ? 'デバッグ情報を隠す' : 'デバッグ情報を表示'}
          </button>
          
          {showDebug && (
            <>
              <div className="mt-4 flex gap-2 flex-wrap">
                <button
                  onClick={() => {
                    const currentValue = localStorage.getItem('use_cached_data') === 'true';
                    localStorage.setItem('use_cached_data', (!currentValue).toString());
                    alert(`キャッシュの使用: ${!currentValue ? '有効' : '無効'}`);
                  }}
                  className="px-3 py-1 bg-blue-50 border border-blue-300 rounded-md hover:bg-blue-100 text-sm text-blue-700"
                >
                  キャッシュ使用を{localStorage.getItem('use_cached_data') === 'true' ? '無効' : '有効'}にする
                </button>
                <button
                  onClick={() => {
                    localStorage.removeItem(`blocks_${pageId}`);
                    localStorage.removeItem(`blocks_${pageId}_timestamp`);
                    alert('このページのキャッシュをクリアしました');
                  }}
                  className="px-3 py-1 bg-yellow-50 border border-yellow-300 rounded-md hover:bg-yellow-100 text-sm text-yellow-700"
                >
                  このページのキャッシュをクリア
                </button>
                <button
                  onClick={() => {
                    window.location.reload();
                  }}
                  className="px-3 py-1 bg-green-50 border border-green-300 rounded-md hover:bg-green-100 text-sm text-green-700"
                >
                  ページを再読み込み
                </button>
              </div>

              <details className="mt-4 border border-gray-200 rounded-md overflow-hidden">
                <summary className="p-4 bg-gray-50 cursor-pointer">ページデータ</summary>
                <div className="p-4 bg-gray-50">
                  <h3 className="text-lg font-semibold mb-2">現在のカテゴリ: {category || 'なし'}</h3>
                  <h3 className="text-lg font-semibold mb-2">プロパティ:</h3>
                  <pre className="bg-white p-4 rounded border border-gray-300 overflow-auto text-xs max-h-96">
                    {JSON.stringify(page.properties, null, 2)}
                  </pre>
                </div>
              </details>
              
              <details className="mt-4 border border-gray-200 rounded-md overflow-hidden">
                <summary className="p-4 bg-gray-50 cursor-pointer">ブロックデータ ({blocks.length} ブロック)</summary>
                <div className="p-4 bg-gray-50">
                  <div className="flex justify-between mb-2">
                    <h3 className="text-lg font-semibold">ブロック:</h3>
                    <button
                      onClick={copyContentAsJson}
                      className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-200 hover:bg-blue-100"
                    >
                      {jsonCopied ? 'コピー完了！' : 'JSONとしてコピー'}
                    </button>
                  </div>
                  <pre className="bg-white p-4 rounded border border-gray-300 overflow-auto text-xs max-h-96">
                    {JSON.stringify(blocks.slice(0, 10), null, 2)}
                    {blocks.length > 10 && (
                      <div className="mt-2 p-2 bg-yellow-50 text-yellow-700 rounded">
                        ... 残り {blocks.length - 10} ブロックは省略されました ...
                      </div>
                    )}
                  </pre>
                </div>
              </details>
              
              <details className="mt-4 border border-gray-200 rounded-md overflow-hidden">
                <summary className="p-4 bg-gray-50 cursor-pointer">リクエスト情報</summary>
                <div className="p-4 bg-gray-50">
                  <pre className="bg-white p-4 rounded border border-gray-300 overflow-auto text-xs">
                    {JSON.stringify(requestState, null, 2)}
                  </pre>
                </div>
              </details>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default PageDetail; 