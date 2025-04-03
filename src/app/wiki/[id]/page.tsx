import Link from 'next/link';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArrowLeft, Calendar, Tag, ExternalLink, Clock, Users } from 'lucide-react';
import { BlockRenderer } from '@/components/notion/BlockRenderer';
import { getPageDetail } from '@/lib/data';

interface PageProps {
  params: {
    id: string;
  };
}

// ページデータの取得
async function fetchPageData(id: string) {
  try {
    const data = await getPageDetail(id);
    return data;
  } catch (error) {
    console.error('ページ取得エラー:', error);
    return null;
  }
}

export default async function WikiDetailPage({ params }: PageProps) {
  const pageData = await fetchPageData(params.id);
  
  if (!pageData) {
    notFound();
  }
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* メインコンテンツ */}
      <div className="lg:col-span-3">
        <div className="mb-6">
          <Link 
            href="/wiki" 
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            ウィキ一覧に戻る
          </Link>
          
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">{pageData.page.title}</h1>
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-2">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              作成: {new Date(pageData.page.created_time).toLocaleDateString('ja-JP')}
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              更新: {new Date(pageData.page.last_edited_time).toLocaleString('ja-JP', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
            {pageData.page.category && (
              <Link href={`/wiki?category=${encodeURIComponent(pageData.page.category)}`} className="flex items-center">
                <Tag className="h-4 w-4 mr-1" />
                {pageData.page.category}
              </Link>
            )}
          </div>
          
          {/* 作者情報の表示 */}
          {pageData.page.authors && pageData.page.authors.length > 0 && (
            <div className="flex items-center text-sm text-gray-600 mb-2">
              <Users className="h-4 w-4 mr-1" />
              <span className="mr-1">執筆者:</span>
              {pageData.page.authors.join(', ')}
            </div>
          )}
          
          {/* Notionへのリンク */}
          {pageData.page.notion_url && (
            <div className="mt-2">
              <a 
                href={pageData.page.notion_url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm"
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                Notionで見る
              </a>
            </div>
          )}
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-6 sm:p-8 shadow-sm">
          {/* ブロックレンダリング */}
          <div className="prose max-w-none">
            {pageData.blocks.map((block: any) => (
              <BlockRenderer key={block.id} block={block} />
            ))}
          </div>
        </div>
      </div>
      
      {/* サイドバー */}
      <div>
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm mb-6 sticky top-4">
          <h3 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-200">関連ページ</h3>
          
          {pageData.relatedPages && pageData.relatedPages.length > 0 ? (
            <ul className="space-y-3">
              {pageData.relatedPages.map((relatedPage: any) => (
                <li key={relatedPage.id}>
                  <Link 
                    href={`/wiki/${relatedPage.id}`} 
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {relatedPage.title}
                  </Link>
                  {relatedPage.category && (
                    <span className="ml-2 text-xs text-gray-500">
                      {relatedPage.category}
                    </span>
                  )}
                  {relatedPage.authors && relatedPage.authors.length > 0 && (
                    <div className="text-xs text-gray-500 mt-1">
                      執筆者: {relatedPage.authors.join(', ')}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm">関連ページはありません</p>
          )}
        </div>
      </div>
    </div>
  );
} 