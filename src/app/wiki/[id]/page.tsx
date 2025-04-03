import Link from 'next/link';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArrowLeft, Calendar, Tag, ExternalLink, Clock, Users, BookOpen } from 'lucide-react';
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
    <div className="zenn-article-container">
      {/* パンくずリスト */}
      <nav className="text-sm mb-6 text-gray-500">
        <Link 
          href="/wiki" 
          className="inline-flex items-center hover:text-gray-700"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          ウィキ一覧に戻る
        </Link>
      </nav>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* メインコンテンツ */}
        <div className="md:col-span-3">
          <article className="zenn-article-content">
            {/* 記事ヘッダー */}
            <header className="zenn-article-header">
              <h1 className="zenn-article-title">{pageData.page.title}</h1>
              
              <div className="zenn-article-meta">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  <time dateTime={pageData.page.created_time}>
                    {new Date(pageData.page.created_time).toLocaleDateString('ja-JP')}
                  </time>
                </div>
                
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  <time dateTime={pageData.page.last_edited_time}>
                    {new Date(pageData.page.last_edited_time).toLocaleString('ja-JP', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </time>
                </div>
                
                {pageData.page.category && (
                  <Link 
                    href={`/wiki?category=${encodeURIComponent(pageData.page.category)}`}
                    className="flex items-center hover:text-var(--accent-color) transition-colors"
                  >
                    <Tag className="h-4 w-4 mr-1" />
                    {pageData.page.category}
                  </Link>
                )}
              </div>
              
              {/* 作者情報の表示 */}
              {pageData.page.authors && pageData.page.authors.length > 0 && (
                <div className="flex items-center text-sm text-gray-600 mb-4">
                  <Users className="h-4 w-4 mr-1" />
                  <span className="mr-1">執筆者:</span>
                  <span className="font-medium">{pageData.page.authors.join(', ')}</span>
                </div>
              )}
            </header>
            
            {/* 目次 (オプション) */}
            <div className="zenn-toc mb-8">
              <div className="font-bold mb-3 flex items-center">
                <BookOpen className="h-4 w-4 mr-1" />
                目次
              </div>
              <p className="text-sm text-gray-500">
                ※ 目次は実装予定の機能です
              </p>
            </div>
            
            {/* 記事本文 */}
            <div className="prose prose-blue max-w-none">
              {pageData.blocks.map((block: any) => (
                <BlockRenderer key={block.id} block={block} />
              ))}
            </div>
            
            {/* Notionへのリンク */}
            {pageData.page.notion_url && (
              <div className="mt-16 pt-4 border-t border-gray-100 text-center">
                <a 
                  href={pageData.page.notion_url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center text-gray-600 hover:text-var(--accent-color) text-sm transition-colors"
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Notionで編集を提案する
                </a>
              </div>
            )}
          </article>
        </div>
        
        {/* サイドバー */}
        <div className="md:col-span-1">
          <div className="sticky top-6">
            <div className="bg-white rounded-lg p-5 shadow-sm mb-6 border border-gray-100">
              <h3 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-100">関連ページ</h3>
              
              {pageData.relatedPages && pageData.relatedPages.length > 0 ? (
                <ul className="space-y-4">
                  {pageData.relatedPages.map((relatedPage: any) => (
                    <li key={relatedPage.id} className="text-sm">
                      <Link 
                        href={`/wiki/${relatedPage.id}`} 
                        className="text-gray-800 hover:text-var(--accent-color) hover:underline block transition-colors"
                      >
                        {relatedPage.title}
                      </Link>
                      
                      <div className="flex mt-1 text-xs text-gray-500 flex-wrap gap-2">
                        {relatedPage.category && (
                          <span className="flex items-center">
                            <Tag className="h-3 w-3 mr-1" />
                            {relatedPage.category}
                          </span>
                        )}
                        
                        {relatedPage.authors && relatedPage.authors.length > 0 && (
                          <span className="flex items-center">
                            <Users className="h-3 w-3 mr-1" />
                            {relatedPage.authors.join(', ')}
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-sm">関連ページはありません</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 