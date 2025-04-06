import React from "react";
import { Metadata } from "next";
import NotionContent from "@/components/NotionContent";
import { getPageDetail, getCategories, getLatestPages } from "@/lib/data";
import Link from "next/link";
import { Search, Menu } from "lucide-react";
import TableOfContents from "@/components/TableOfContents";
// 相対パスでインポート
import ArticleSearch from "../../../components/ArticleSearch";
// 分離したコンポーネントをインポート
import { InlineRelatedArticlesSection, LocalRelatedPage } from "./InlineRelatedArticlesSection";
// Navigationコンポーネントをインポート
import Navigation from "@/components/Navigation";

interface PageProps {
  params: {
    id: string;
  };
}

// ページページのメタデータを設定
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

// 最新ページを取得する関数
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

export default async function WikiDetailPage({ params }: PageProps) {
  const pageData = await fetchPageData(params.id);
  const categories = await getCategories();
  const latestPages = await fetchLatestPages(5);
  
  // デバッグ: 取得したページデータのauthorsフィールドを確認
  if (pageData && pageData.page) {
    console.log('Page data authors:', pageData.page.authors);
  }
  
  // relatedPagesの構造をログ出力して確認
  if (pageData && pageData.relatedPages) {
    console.log('Related pages structure:', 
      pageData.relatedPages.length > 0 ? 
      JSON.stringify(pageData.relatedPages[0], null, 2) : 
      'No related pages');
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
  
  // 関連ページのデータを適切な形式に変換（型エラーを避けるため一時的にany型を使用）
  const formattedRelatedPages = pageData.relatedPages?.map((page: any) => ({
    id: page.id,
    title: page.title,
    category: page.category || '未分類',
    authors: page.authors,
    last_edited_time: page.last_edited_time || '',
    created_time: page.created_time || ''
  })) || [];
  
  return (
    <div className="bg-white">
      {/* ナビゲーションメニューをコンポーネントとして使用 */}
      <Navigation categories={categories} />
      
      {/* メインコンテンツエリア - 3カラムレイアウト */}
      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* 左サイドバー - ページ検索とページ著者リスト */}
        <div className="md:col-span-2">
          {/* ページ検索バー */}
          <ArticleSearch />
          
          {/* 関連ページ一覧 - クライアントコンポーネントを使用 */}
          <InlineRelatedArticlesSection relatedPages={formattedRelatedPages} />
          
          {/* 最新の記事一覧 */}
          <div className="bg-blue-50 p-3 rounded shadow-sm mt-4">
            <h3 className="text-center text-gray-700 font-medium mb-3">最近更新された記事</h3>
            
            {latestPages && latestPages.length > 0 ? (
              <div className="space-y-3">
                {latestPages.map((latestPage: any) => (
                  <Link key={latestPage.id} href={`/wiki/${latestPage.id}`}>
                    <div className="bg-white p-3 rounded hover:bg-blue-50 transition-colors">
                      <p className="text-sm font-medium text-gray-800 mb-1 line-clamp-2">{latestPage.title}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                          {latestPage.category || '未分類'}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-white p-3 rounded text-center text-gray-500 text-sm">
                <p>記事情報を取得できませんでした</p>
              </div>
            )}
          </div>
        </div>
        
        {/* 中央カラム - ページ内容 */}
        <div className="md:col-span-7">
          {/* ページタイトル */}
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
          
          {/* ページ内容 */}
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
                <p className="mt-2">このページにはまだ内容が追加されていません。</p>
              </div>
            )}
          </div>
        </div>
        
        {/* 右サイドバー - 著者情報と目次 */}
        <div className="md:col-span-3">
          {/* 著者情報 */}
          <div className="bg-blue-50 p-4 mb-4 rounded shadow-sm">
            {page.authors && Array.isArray(page.authors) && page.authors.length > 0 ? (
              <>
                {/* 複数の著者がいる場合は横並びで表示 */}
                <div className="flex flex-wrap justify-center gap-4 mb-4">
                  {page.authors
                    .filter(author => typeof author === 'string')
                    .map((author, index) => (
                      <div key={index} className="flex flex-col items-center">
                        <div className="bg-blue-400 rounded-full w-12 h-12 mb-2 flex items-center justify-center text-white text-lg font-bold">
                          {typeof author === 'string' ? author.substring(0, 1).toUpperCase() : '👤'}
                        </div>
                        <span className="text-sm text-gray-600">{author}</span>
                      </div>
                    ))
                  }
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-col items-center mb-4">
                  <div className="bg-blue-400 rounded-full w-16 h-16 mb-2 flex items-center justify-center text-white text-2xl font-bold">
                    👤
                  </div>
                  <h3 className="text-lg font-medium text-center">
                    匿名編集者
                  </h3>
                </div>
              </>
            )}
            {/* <div className="text-center">
              <p className="text-gray-600 text-sm">ページの執筆者プロフィール(未実装)</p>
            </div> */}
          </div>
          
          {/* 目次 - クライアントコンポーネント化（目次がある場合のみ表示） */}
          {toc.length > 0 && <TableOfContents toc={toc} />}
        </div>
      </div>
    </div>
  );
} 