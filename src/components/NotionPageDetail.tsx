import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';

interface NotionPage {
  id: string;
  properties: Record<string, any>;
  created_time: string;
  last_edited_time: string;
}

interface NotionData {
  results: NotionPage[];
}

function NotionPageDetail() {
  const params = useParams();
  const pageId = params?.pageId as string;
  const router = useRouter();
  const [page, setPage] = useState<NotionPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPageData = async () => {
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
          throw new Error('Failed to fetch data');
        }

        const result: NotionData = await response.json();
        const foundPage = result.results.find(p => p.id === pageId);
        
        if (!foundPage) {
          throw new Error('ページが見つかりませんでした');
        }

        setPage(foundPage);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchPageData();
  }, [pageId]);

  // ページタイトルを設定
  useEffect(() => {
    if (page && page.properties) {
      // タイトルプロパティを探す
      const titleProperty = Object.values(page.properties).find(
        prop => prop.type === 'title'
      );
      
      let pageTitle = 'ページ詳細';
      
      if (titleProperty && titleProperty.title && titleProperty.title.length > 0) {
        pageTitle = titleProperty.title[0].plain_text;
      }
      
      document.title = `${pageTitle} | FIRST Program Japan Wiki`;
    }
    
    return () => {
      // コンポーネントのアンマウント時にタイトルをリセット
      document.title = 'FIRST Program Japan Wiki';
    };
  }, [page]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPropertyValue = (property: any) => {
    if (!property) return '';

    switch (property.type) {
      case 'title':
        return property.title?.[0]?.plain_text || '';
      case 'rich_text':
        return property.rich_text?.[0]?.plain_text || '';
      case 'select':
        return property.select?.name || '';
      case 'multi_select':
        return property.multi_select?.map((item: any) => item.name).join(', ') || '';
      case 'date':
        return property.date?.start ? formatDate(property.date.start) : '';
      case 'checkbox':
        return property.checkbox ? '✅' : '❌';
      case 'number':
        return property.number?.toString() || '';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-md flex items-center gap-3">
          <AlertCircle className="text-red-500 w-6 h-6" />
          <p className="text-red-600">エラー: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/"
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          一覧に戻る
        </Link>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="space-y-6">
            {Object.entries(page.properties).map(([key, value]) => (
              <div key={key} className="border-b border-gray-200 pb-4 last:border-0">
                <h3 className="text-sm font-medium text-gray-500 mb-1">{key}</h3>
                <p className="text-gray-900">{getPropertyValue(value)}</p>
              </div>
            ))}
            
            <div className="border-t border-gray-200 pt-4 mt-6">
              <div className="flex justify-between text-sm text-gray-500">
                <span>作成日時: {formatDate(page.created_time)}</span>
                <span>最終更新: {formatDate(page.last_edited_time)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NotionPageDetail;