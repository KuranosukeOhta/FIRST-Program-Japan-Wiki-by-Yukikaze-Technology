import React from "react";
import { Metadata } from "next";
import NotionContent from "@/components/NotionContent";
import { getPageDetail } from "@/lib/notion";
import { getRelatedPages } from "@/lib/related";
import { NotionPage } from "@/types";
import Link from "next/link";

interface PageProps {
  params: {
    id: string;
  };
}

// 記事ページのメタデータを設定
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const pageDetail = await fetchPageData(params.id);
  if (!pageDetail) {
    return {
      title: '記事が見つかりません',
      description: '指定された記事が見つかりませんでした。'
    };
  }

  return {
    title: `${pageDetail.page.title} | FIRST Program Japan Wiki`,
    description: pageDetail.page.description || `${pageDetail.page.title}に関する情報です。`,
  };
}

// ページデータを取得する関数
async function fetchPageData(id: string) {
  try {
    const pageDetail = await getPageDetail(id);
    const relatedPages = await getRelatedPages(id, pageDetail.page.category || "");
    return { page: pageDetail.page, blocks: pageDetail.blocks, relatedPages };
  } catch (error) {
    console.error("Error fetching page data:", error);
    return null;
  }
}

// 目次を生成する関数
function generateTableOfContents(blocks: any[]) {
  if (!blocks) return [];
  
  const headings = blocks.filter((block) => 
    block.type?.startsWith('heading_')
  ).map(block => {
    const level = parseInt(block.type.split('_')[1]);
    const text = block.heading_1?.rich_text?.[0]?.plain_text || 
                block.heading_2?.rich_text?.[0]?.plain_text || 
                block.heading_3?.rich_text?.[0]?.plain_text || '';
    return { level, text };
  });
  
  return headings;
}

export default async function WikiDetailPage({ params }: PageProps) {
  const data = await fetchPageData(params.id);
  
  if (!data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-red-600">記事が見つかりません</h1>
          <p className="mt-4">
            お探しの記事は存在しないか、削除された可能性があります。
          </p>
          <Link href="/wiki" className="mt-6 inline-block text-blue-500 hover:underline">
            記事一覧に戻る
          </Link>
        </div>
      </div>
    );
  }

  const { page, blocks, relatedPages } = data;
  const toc = generateTableOfContents(blocks);
  const categoryPath = page.category ? `/category/${encodeURIComponent(page.category)}` : null;

  return (
    <div className="zenn-article-container">
      {/* 左サイドバー - シェアボタン */}
      <div className="zenn-share-column">
        <div className="zenn-share-button">
          <svg width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="currentColor"/>
          </svg>
        </div>
        <div className="zenn-like-count">44</div>
        
        <div className="zenn-share-button mt-4">
          <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z" fill="currentColor"/>
          </svg>
        </div>
        
        <div className="zenn-share-button mt-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <path fill="currentColor" d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
          </svg>
        </div>
        
        <div className="zenn-share-button mt-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <path fill="currentColor" d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm-2 16h-2v-6h2v6zm-1-6.891c-.607 0-1.1-.496-1.1-1.109 0-.612.492-1.109 1.1-1.109s1.1.497 1.1 1.109c0 .613-.493 1.109-1.1 1.109zm8 6.891h-1.998v-2.861c0-1.881-2.002-1.722-2.002 0v2.861h-2v-6h2v1.093c.872-1.616 4-1.736 4 1.548v3.359z"/>
          </svg>
        </div>
      </div>
      
      {/* 中央カラム - 記事本文 */}
      <div className="zenn-article-content-wrapper">
        <div className="zenn-article-content">
          <div className="zenn-article-header">
            {/* パンくずリスト */}
            <div className="text-sm mb-6">
              <Link href="/wiki" className="text-gray-500 hover:text-gray-700">
                ホーム
              </Link>
              {categoryPath && (
                <>
                  <span className="mx-2 text-gray-400">/</span>
                  <Link href={categoryPath} className="text-gray-500 hover:text-gray-700">
                    {page.category}
                  </Link>
                </>
              )}
            </div>
            
            {/* アイキャッチ */}
            <div className="zenn-article-eyecatch">
              <div className="zenn-article-emoji">
                👷
              </div>
            </div>
            
            {/* タイトル */}
            <h1 className="zenn-article-title">{page.title}</h1>
            
            {/* メタ情報 */}
            <div className="zenn-article-meta">
              <div>{new Date(page.last_edited_time).toLocaleDateString('ja-JP')}</div>
              {page.authors && page.authors.length > 0 && (
                <div>著者: {page.authors.join(', ')}</div>
              )}
            </div>
            
            {/* タグ */}
            {page.category && (
              <div className="mb-4">
                <Link href={categoryPath || '#'} className="zenn-tag">
                  {page.category}
                </Link>
              </div>
            )}
          </div>
          
          {/* 記事本文 */}
          <div className="prose max-w-none">
            <NotionContent blocks={blocks} />
          </div>
        </div>
      </div>
      
      {/* 右サイドバー - 目次と関連記事 */}
      <div className="zenn-sidebar">
        {/* 目次 */}
        {toc.length > 0 && (
          <div className="zenn-toc">
            <div className="zenn-toc-heading">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
              目次
            </div>
            <ul className="space-y-2">
              {toc.map((heading, idx) => (
                <li 
                  key={idx} 
                  className={`text-sm ${
                    heading.level === 1 ? 'font-semibold' : 
                    heading.level === 2 ? 'pl-3' : 'pl-6'
                  }`}
                >
                  <a href={`#heading-${idx}`} className="text-gray-600 hover:text-accent">
                    {heading.text}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* 著者情報 */}
        {page.authors && page.authors.length > 0 && (
          <div className="zenn-author-card">
            <div className="zenn-author-avatar">
              <img 
                src="https://via.placeholder.com/80" 
                alt={page.authors[0]} 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="zenn-author-name">
              {page.authors[0]}
            </div>
            <div className="zenn-author-bio">
              FIRST Programに関する情報を発信しています。
            </div>
            <button className="zenn-follow-button">
              フォロー
            </button>
          </div>
        )}
        
        {/* 関連記事 */}
        {relatedPages && relatedPages.length > 0 && (
          <div className="bg-white rounded-lg shadow mt-6 p-6">
            <h3 className="font-bold text-lg mb-4">関連記事</h3>
            <ul className="space-y-3">
              {relatedPages.map((relatedPage: NotionPage) => (
                <li key={relatedPage.id}>
                  <Link 
                    href={`/wiki/${relatedPage.id}`}
                    className="text-sm text-gray-700 hover:text-accent hover:underline"
                  >
                    {relatedPage.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
} 