"use client";

import React, { useState } from "react";
import { Metadata } from "next";
import NotionContent from "@/components/NotionContent";
import { getPageDetail, getCategories, getLatestPages } from "@/lib/data";
// 関連ページの機能を削除
// import { getRelatedPages } from "@/lib/related";
// import { NotionPage } from "@/types";
import Link from "next/link";
import { Search, Menu } from "lucide-react";
import TableOfContents from "@/components/TableOfContents";
// 相対パスでインポート
import ArticleSearch from "../../../components/ArticleSearch";
import SortMenu from "../../../components/SortMenu";
import RelatedArticlesSection from "../../../components/RelatedArticlesSection";

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

// 最新記事を取得する関数
async function fetchLatestPages(limit = 5) {
  try {
    const result = await getLatestPages(limit);
    return result.pages || [];
  } catch (error) {
    console.error(`Error fetching latest pages: ${error}`);
    return [];
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
    
    // コンテンツを適切に解析
    let content;
    if (heading.content) {
      try {
        // 既にオブジェクトならそのまま使用
        if (typeof heading.content === 'object') {
          content = heading.content;
        } else if (typeof heading.content === 'string') {
          // 文字列ならJSONとしてパース
          content = JSON.parse(heading.content);
        } else {
          content = {};
        }
      } catch (error) {
        console.error('見出しコンテンツの解析に失敗しました:', error);
        content = {};
      }
    } else {
      content = {};
    }
    
    const richText = content[heading.type]?.rich_text || [];
    const text = richText.map((rt: any) => rt.plain_text || '').join('');
    // ヘッダーIDを安定させるために見出しテキストからスラッグを生成
    const slug = text
      ? text
          .toLowerCase()
          .replace(/[^\w\s-]/g, '') // 特殊文字を除去
          .replace(/\s+/g, '-') // スペースをハイフンに変換
          .replace(/--+/g, '-') // 連続するハイフンを1つに
      : `heading-${index}`;
          
    return { 
      id: slug, 
      text: text || `見出し ${index + 1}`, 
      level,
      blockId: heading.id // 元のブロックIDも保持
    };
  });
}

// 関連記事のインターフェイス
interface RelatedPage {
  id: string;
  title: string;
  category: string;
  authors?: string[];
  last_edited_time: string;
  created_time: string;
}

// 関連記事セクション用のprops
interface RelatedArticlesSectionProps {
  relatedPages: RelatedPage[] | undefined;
}

// 関連記事セクションコンポーネント
export function RelatedArticlesSection({ relatedPages }: RelatedArticlesSectionProps) {
  const [sortedPages, setSortedPages] = useState(relatedPages || []);
  const [currentSort, setCurrentSort] = useState("lastEdited");

  // 並べ替え処理
  const handleSortChange = (sortValue: string) => {
    setCurrentSort(sortValue);
    if (!relatedPages || relatedPages.length === 0) return;

    const newSortedPages = [...relatedPages];
    
    switch (sortValue) {
      case "title":
        newSortedPages.sort((a, b) => a.title.localeCompare(b.title, 'ja'));
        break;
      case "created":
        newSortedPages.sort((a, b) => 
          new Date(b.created_time).getTime() - new Date(a.created_time).getTime()
        );
        break;
      case "lastEdited":
      default:
        newSortedPages.sort((a, b) => 
          new Date(b.last_edited_time).getTime() - new Date(a.last_edited_time).getTime()
        );
        break;
    }
    
    setSortedPages(newSortedPages);
  };

  return (
    <>
      {/* 関連記事の並び替えメニュー */}
      <SortMenu 
        mode="related" 
        onSortChange={handleSortChange} 
        title="関連記事の並び替え"
        initialSort={currentSort} 
      />
      
      {/* 関連記事一覧 */}
      <div className="bg-blue-50 p-3 mb-4 rounded shadow-sm">
        <h3 className="text-center text-gray-700 font-medium mb-3">カテゴリの他の記事</h3>
        
        {sortedPages && sortedPages.length > 0 ? (
          <div className="space-y-3">
            {sortedPages.map((relatedPage) => (
              <Link key={relatedPage.id} href={`/wiki/${relatedPage.id}`}>
                <div className="bg-white p-3 rounded hover:bg-blue-50 transition-colors">
                  <p className="text-sm font-medium text-gray-800 mb-1 line-clamp-2">{relatedPage.title}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                      {relatedPage.category || '未分類'}
                    </span>
                    {Array.isArray(relatedPage.authors) && relatedPage.authors.length > 0 && (
                      <span className="text-xs text-gray-500">
                        {relatedPage.authors[0]}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white p-3 rounded text-center text-gray-500 text-sm">
            <p>関連記事がありません</p>
          </div>
        )}
      </div>
    </>
  );
}

export default async function WikiDetailPage({ params }: PageProps) {
  const pageData = await fetchPageData(params.id);
  const categories = await getCategories();
  const latestPages = await fetchLatestPages(5);
  
  // デバッグ: 取得したページデータのauthorsフィールドを確認
  if (pageData && pageData.page) {
    console.log('Page data authors:', pageData.page.authors);
  }
  
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
    <div className="bg-white">
      {/* ナビゲーションメニュー（グローバルヘッダーの下に追加） */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center space-x-6">
            <div className="relative group">
              <Link href="/wiki" className="text-gray-700 hover:text-blue-600 font-medium py-2 flex items-center">
                ページを見る
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </Link>
              
              {/* カテゴリメニュー（ホバー時に表示） */}
              <div className="absolute left-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 hidden group-hover:block z-10">
                <div className="py-2">
                  {categories && categories.length > 0 ? (
                    <>
                      {categories.map((category: string) => (
                        <Link 
                          key={category} 
                          href={`/wiki?category=${encodeURIComponent(category)}`}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                        >
                          {category}
                        </Link>
                      ))}
                    </>
                  ) : (
                    <span className="block px-4 py-2 text-sm text-gray-500">カテゴリがありません</span>
                  )}
                </div>
              </div>
            </div>
            <Link href="/about" className="text-gray-700 hover:text-blue-600 font-medium py-2">
              Wikiについて
            </Link>
            <Link href="/team" className="text-gray-700 hover:text-blue-600 font-medium py-2">
              運営団体について
            </Link>
            <Link href="/edit" className="text-gray-700 hover:text-blue-600 font-medium py-2">
              記事を書く
            </Link>
            <Link href="/contact" className="text-gray-700 hover:text-blue-600 font-medium py-2">
              お問い合わせ
            </Link>
          </div>
        </div>
      </div>
      
      {/* メインコンテンツエリア - 3カラムレイアウト */}
      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* 左サイドバー - 記事検索と記事著者リスト */}
        <div className="md:col-span-2">
          {/* 記事検索バー */}
          <ArticleSearch />
          
          {/* グローバル並び替えメニュー */}
          <SortMenu mode="global" />
          
          {/* 関連記事一覧 - クライアントコンポーネントを使用 */}
          <RelatedArticlesSection relatedPages={pageData.relatedPages} />
          
          {/* 最新の記事一覧 */}
          <div className="bg-blue-50 p-3 mb-4 rounded shadow-sm">
            <h3 className="text-center text-gray-700 font-medium mb-3">最近更新された記事</h3>
            
            {latestPages && latestPages.length > 0 ? (
              <div className="space-y-3">
                {latestPages.map((latestPage) => (
                  <Link key={latestPage.id} href={`/wiki/${latestPage.id}`}>
                    <div className="bg-white p-3 rounded hover:bg-blue-50 transition-colors">
                      <p className="text-sm font-medium text-gray-800 mb-1 line-clamp-2">{latestPage.title}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                          {latestPage.category || '未分類'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(latestPage.last_edited_time).toLocaleDateString('ja-JP')}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-white p-3 rounded text-center text-gray-500 text-sm">
                <p>最新の記事がありません</p>
              </div>
            )}
          </div>
        </div>
        
        {/* 中央カラム - 記事内容 */}
        <div className="md:col-span-7">
          {/* 記事タイトル */}
          <div className="bg-blue-50 p-5 mb-6 rounded shadow-sm">
            <h1 className="text-2xl md:text-3xl font-bold text-center">{page.title}</h1>
            {/* 執筆日と更新日を追加 */}
            <div className="mt-3 text-sm text-gray-600 text-center">
              <p>執筆日: {new Date(page.created_time).toLocaleString('ja-JP', { 
                year: 'numeric', month: '2-digit', day: '2-digit' 
              })}</p>
              <p>更新日: {new Date(page.last_edited_time).toLocaleString('ja-JP', { 
                year: 'numeric', month: '2-digit', day: '2-digit', 
                hour: '2-digit', minute: '2-digit' 
              })}</p>
            </div>
          </div>
          
          {/* 記事内容 */}
          <div className="bg-white p-6 rounded shadow border border-gray-100">
            {/* 実際のNotion APIから取得したデータを表示 */}
            <div className="prose prose-blue max-w-none">
              {/* 目次のアンカーリンクのためにheadingIdをブロックに追加 */}
              <NotionContent 
                blocks={blocks?.map((block, index) => {
                  if (block.type.startsWith('heading_')) {
                    // 目次項目から対応するデータを検索
                    const tocItem = toc.find(item => item.blockId === block.id);
                    return { 
                      ...block, 
                      // 対応する目次項目があればそのIDを使用、なければブロックのインデックス
                      headingId: tocItem ? tocItem.id : `heading-${index}`
                    };
                  }
                  return block;
                }) || []}
              />
            </div>
            
            {/* データがない場合のフォールバック表示 */}
            {(!blocks || blocks.length === 0) && (
              <div className="text-center p-8 text-gray-500">
                <p className="text-lg font-medium">コンテンツがありません</p>
                <p className="mt-2">この記事にはまだ内容が追加されていません。</p> {/* mt-2とはmargin-topの2倍の意味、margin-topは上からの余白を表す */}
              </div>
            )}
          </div>
        </div>
        
        {/* 右サイドバー - 著者情報と目次 */}
        <div className="md:col-span-3">
          {/* 著者情報 */}
          <div className="bg-blue-50 p-4 mb-4 rounded shadow-sm">
            <div className="flex flex-col items-center mb-4">
              <div className="bg-blue-400 rounded-full w-16 h-16 mb-2 flex items-center justify-center text-white text-2xl font-bold">
                {page.authors && Array.isArray(page.authors) && page.authors.length > 0 && typeof page.authors[0] === 'string' 
                  ? page.authors[0].substring(0, 1).toUpperCase() 
                  : '👤'}
              </div>
              <h3 className="text-lg font-medium text-center">
                {page.authors && Array.isArray(page.authors) && page.authors.length > 0 
                  ? page.authors.filter(author => typeof author === 'string').join(', ') 
                  : '匿名編集者'}
              </h3>
            </div>
            {/* <div className="text-center">
              <p className="text-gray-600 text-sm">記事の執筆者プロフィール(未実装)</p>
            </div> */}
          </div>
          
          {/* 目次 - クライアントコンポーネント化（目次がある場合のみ表示） */}
          {toc.length > 0 && <TableOfContents toc={toc} />}
        </div>
      </div>
    </div>
  );
} 