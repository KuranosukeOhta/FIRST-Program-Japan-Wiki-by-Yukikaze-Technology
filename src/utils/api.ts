import { useState, useEffect } from 'react';

/**
 * CORS問題を回避するAPIリクエストヘルパー
 * @param url APIエンドポイントURL
 * @param options フェッチオプション
 * @returns レスポンスデータ、ロード状態、エラー
 */
export const useFetch = <T>(url: string, options?: RequestInit) => {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // タイムスタンプを追加してキャッシュを無効化
  const getUrlWithTimestamp = (baseUrl: string) => {
    const timestamp = new Date().getTime();
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}t=${timestamp}`;
  };

  // CORS回避のプリフライトチェック
  const checkCORS = async () => {
    try {
      // 1x1透明GIFをロード
      const img = new Image();
      img.src = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/ping?t=${new Date().getTime()}`;
      
      // 2秒待つ
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          resolve();
        }, 2000);
        
        img.onload = () => {
          clearTimeout(timeout);
          resolve();
        };
        
        img.onerror = () => {
          clearTimeout(timeout);
          resolve();
        };
      });
      
      return true;
    } catch (error) {
      console.error('CORS check failed:', error);
      return false;
    }
  };

  // 実際のフェッチ処理
  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // CORS確認
      await checkCORS();
      
      // AbortControllerを使用して60秒タイムアウト
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);
      
      const fullUrl = getUrlWithTimestamp(url);
      console.log(`Fetching: ${fullUrl}`);
      
      const response = await fetch(fullUrl, {
        ...options,
        headers: {
          ...options?.headers,
          'Cache-Control': 'no-cache',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`API エラー: ${response.status} ${response.statusText}`);
      }
      
      const jsonData = await response.json();
      setData(jsonData);
      setError(null);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err instanceof Error ? err : new Error('不明なエラー'));
      
      // 最大3回まで自動リトライ（5秒待ち）
      if (retryCount < 3) {
        setTimeout(() => {
          console.log(`Retrying... (${retryCount + 1}/3)`);
          setRetryCount(prev => prev + 1);
        }, 5000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [url, retryCount]);

  return { data, isLoading, error, refetch: fetchData };
};

/**
 * サポートされているNotionブロックタイプのリスト
 */
export const SUPPORTED_BLOCK_TYPES = [
  'paragraph',
  'heading_1',
  'heading_2',
  'heading_3',
  'bulleted_list_item',
  'numbered_list_item',
  'to_do',
  'toggle',
  'code',
  'quote',
  'callout',
  'image',
  'divider',
  'bookmark',
  'video',
  'embed',
  'file',
  'pdf',
  'link_preview',
  'table',
  'table_row',
];

/**
 * ブロックが表示をサポートされているか確認
 */
export const isBlockTypeSupported = (blockType: string): boolean => {
  return SUPPORTED_BLOCK_TYPES.includes(blockType);
};

/**
 * エラーメッセージからわかりやすいメッセージを生成
 */
export const getReadableErrorMessage = (error: Error) => {
  if (error.message.includes('Failed to fetch')) {
    return 'ネットワークエラー: サーバーに接続できません。インターネット接続を確認してください。';
  }
  
  if (error.name === 'AbortError') {
    return 'タイムアウト: リクエストの処理に時間がかかりすぎています。しばらくしてからもう一度お試しください。';
  }
  
  return error.message;
};

export default useFetch; 