import React from "react";
import { Metadata } from "next";
import NotionContent from "@/components/NotionContent";
import { getPageDetail } from "@/lib/data";
// 関連ページの機能を削除
// import { getRelatedPages } from "@/lib/related";
// import { NotionPage } from "@/types";
import Link from "next/link";

interface PageProps {
  params: {
    id: string;
  };
}

// 記事ページのメタデータを設定
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const pageData = await fetchPageData(params.id);
  
  return {
    title: pageData?.page?.title || "ページが見つかりません",
    description: "FIRST Programに関する情報共有のためのウィキサイトです。",
  };
}

// ページデータを取得する関数
async function fetchPageData(id: string) {
  try {
    // getPageDetailが存在しない場合はこちらを使用
    // const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pages/${id}`);
    // if (!response.ok) return null;
    // return await response.json();
    
    return await getPageDetail(id);
  } catch (error) {
    console.error(`Error fetching page data: ${error}`);
    return null;
  }
}

// 目次を生成する関数
function generateTableOfContents(blocks: any[]) {
  const headings = blocks.filter(block => 
    block.type === 'heading_1' || 
    block.type === 'heading_2' || 
    block.type === 'heading_3'
  );
  
  return headings.map((heading, index) => {
    const level = parseInt(heading.type.split('_')[1]);
    const content = heading.content ? JSON.parse(heading.content) : {};
    const richText = content[heading.type]?.rich_text || [];
    const text = richText.map((rt: any) => rt.plain_text).join('');
    return { id: `heading-${index}`, text: text || `見出し ${index + 1}`, level };
  });
}

export default async function WikiDetailPage({ params }: PageProps) {
  const pageData = await fetchPageData(params.id);
  
  if (!pageData) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-red-500">ページが見つかりません</h1>
        <p className="mt-4">
          指定されたIDのページは存在しないか、アクセスできません。
        </p>
        <Link href="/" className="mt-8 inline-block text-blue-500 hover:underline">
          ホームに戻る
        </Link>
      </div>
    );
  }
  
  const { page, blocks } = pageData;
  const toc = generateTableOfContents(blocks || []);
  
  // 関連ページの取得を無効化
  // const relatedPages = await getRelatedPages(params.id, pageData.category);
  
  return (
    <div className="zenn-article-container">
      {/* 左サイドバー - シェアボタン */}
      <div className="zenn-share-column">
        <div className="sticky top-24">
          <button className="zenn-share-button mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
            <span className="zenn-like-count">0</span>
          </button>
          <button className="zenn-share-button">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
            </svg>
          </button>
        </div>
      </div>
      
      {/* メインコンテンツエリア */}
      <div className="zenn-article-content-wrapper">
        <article className="zenn-article-content">
          {/* 記事ヘッダー */}
          <header className="zenn-article-header">
            <h1 className="zenn-article-title">{page.title}</h1>
            <div className="zenn-article-meta">
              {page.category && (
                <Link href={`/category/${page.category}`} className="zenn-tag">
                  {page.category}
                </Link>
              )}
              <time dateTime={page.last_edited_time}>
                {new Date(page.last_edited_time).toLocaleDateString('ja-JP')}
              </time>
            </div>
          </header>
          
          {/* 記事のメインコンテンツ */}
          <div className="prose max-w-none">
            <NotionContent blocks={blocks || []} />
          </div>
        </article>
      </div>
      
      {/* 右サイドバー - 目次 */}
      <div className="zenn-sidebar">
        <div className="sticky top-24">
          {toc.length > 0 && (
            <div className="zenn-toc">
              <h3 className="zenn-toc-heading">目次</h3>
              <ul>
                {toc.map((item) => (
                  <li key={item.id} style={{ paddingLeft: `${(item.level - 1) * 1}rem` }}>
                    <a href={`#${item.id}`}>{item.text}</a>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* 著者情報 */}
          <div className="zenn-author-card mt-6">
            <div className="zenn-author-avatar">
              {/* デフォルトアバター */}
              <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" width="40" height="40">
                <circle cx="18" cy="18" r="18" fill="#EDF2F7" />
                <path fillRule="evenodd" clipRule="evenodd" d="M18 9C14.6863 9 12 11.6863 12 15C12 18.3137 14.6863 21 18 21C21.3137 21 24 18.3137 24 15C24 11.6863 21.3137 9 18 9ZM18 27C13.0294 27 9 25.0902 9 22.5C9 19.9098 13.0294 18 18 18C22.9706 18 27 19.9098 27 22.5C27 25.0902 22.9706 27 18 27Z" fill="#A0AEC0" />
              </svg>
            </div>
            <div className="zenn-author-info">
              <h3 className="zenn-author-name">FIRST Program Japan Wiki</h3>
              <p className="zenn-author-bio">
                FIRSTプログラムに関する情報を共有するウィキサイトです。
              </p>
              <button className="zenn-follow-button">
                フォロー
              </button>
            </div>
          </div>
          
          {/* 関連記事セクションを無効化 */}
          {/*
          {relatedPages && relatedPages.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-bold mb-4">関連記事</h3>
              <ul className="space-y-3">
                {relatedPages.map(relatedPage => (
                  <li key={relatedPage.id}>
                    <Link href={`/wiki/${relatedPage.id}`} className="block hover:bg-gray-50 p-2 rounded">
                      <h4 className="font-medium text-blue-600">{relatedPage.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{relatedPage.description?.substring(0, 60)}...</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          */}
        </div>
      </div>
    </div>
  );
} 