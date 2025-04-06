import React from "react";
import { Metadata } from "next";
import NotionContent from "@/components/NotionContent";
import { getPageDetail, getCategories } from "@/lib/data";
// 関連ページの機能を削除
// import { getRelatedPages } from "@/lib/related";
// import { NotionPage } from "@/types";
import Link from "next/link";
import { Search, Menu } from "lucide-react";

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
    return { id: `heading-${index}`, text: text || `見出し ${index + 1}`, level };
  });
}

// 著者リスト（ダミーデータ）
const authors = [
  { id: "1", name: "山田太郎", avatar: null },
  { id: "2", name: "佐藤花子", avatar: null },
  { id: "3", name: "鈴木一郎", avatar: null },
  { id: "4", name: "田中二郎", avatar: null },
  { id: "5", name: "高橋三郎", avatar: null },
  { id: "6", name: "伊藤四郎", avatar: null }
];

export default async function WikiDetailPage({ params }: PageProps) {
  const pageData = await fetchPageData(params.id);
  const categories = await getCategories();
  
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
    <div className="bg-gray-50">
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
          <div className="bg-gray-300 p-4 mb-4 rounded">
            <h3 className="text-center text-gray-700 font-medium mb-2">記事検索バー</h3>
            <div className="relative">
              <input 
                type="text" 
                className="w-full bg-white rounded px-3 py-2 pr-8 text-sm"
                placeholder="記事を検索..."
              />
              <Search className="absolute right-2 top-2 h-4 w-4 text-gray-400" />
            </div>
          </div>
          
          {/* 並び替えメニュー */}
          <div className="bg-gray-300 p-3 mb-4 rounded flex items-center justify-between">
            <span className="text-sm text-gray-700">並び替えメニュー</span>
            <Menu className="h-4 w-4 text-gray-700" />
          </div>
          
          {/* 記事著者リスト */}
          {authors.map((author) => (
            <div key={author.id} className="bg-gray-300 p-3 mb-4 rounded flex">
              <div className="mr-3">
                <div className="bg-blue-400 rounded-full w-10 h-10 flex items-center justify-center text-white text-sm font-medium">
                  {author.name.substring(0, 1)}
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">記事者名</p>
                <p className="text-xs text-blue-500">{author.name}</p>
              </div>
            </div>
          ))}
        </div>
        
        {/* 中央カラム - 記事内容 */}
        <div className="md:col-span-7">
          {/* 記事タイトル */}
          <div className="bg-gray-300 p-5 mb-6 rounded">
            <h1 className="text-2xl md:text-3xl font-bold text-center">{page.title}</h1>
          </div>
          
          {/* 記事内容 */}
          <div className="bg-gray-300 p-6 rounded">
            {/* 実際のNotion APIから取得したデータを表示 */}
            <div className="prose prose-blue max-w-none">
              <NotionContent blocks={blocks || []} />
            </div>
            
            {/* データがない場合のフォールバック表示 */}
            {(!blocks || blocks.length === 0) && (
              <div className="text-center p-8 text-gray-500">
                <p className="text-lg font-medium">コンテンツがありません</p>
                <p className="mt-2">この記事にはまだ内容が追加されていません。</p>
              </div>
            )}
          </div>
        </div>
        
        {/* 右サイドバー - 著者情報と目次 */}
        <div className="md:col-span-3">
          {/* 著者情報 */}
          <div className="bg-gray-300 p-4 mb-4 rounded">
            <div className="flex flex-col items-center mb-4">
              <div className="bg-blue-400 rounded-full w-16 h-16 mb-2 flex items-center justify-center text-white text-2xl font-bold">
                {page.authors && page.authors.length > 0 ? page.authors[0].substring(0, 1).toUpperCase() : "A"}
              </div>
              <h3 className="text-lg font-medium text-center">
                {page.authors && page.authors.length > 0 ? page.authors.join(', ') : "Wiki編集者"}
              </h3>
            </div>
            <p className="text-center text-sm mb-4">プロフィール内容</p>
          </div>
          
          {/* 目次 */}
          <div className="bg-gray-300 p-4 rounded">
            <h3 className="text-lg font-medium mb-4">目次</h3>
            {toc.length > 0 ? (
              <ul className="space-y-2">
                {toc.map((item) => (
                  <li key={item.id}>
                    <a href={`#${item.id}`} className="text-gray-700 hover:text-blue-600 hover:underline text-sm">
                      • {item.text}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-700 hover:text-blue-600 hover:underline text-sm">• はじめに</a></li>
                <li><a href="#" className="text-gray-700 hover:text-blue-600 hover:underline text-sm">• .</a></li>
                <li><a href="#" className="text-gray-700 hover:text-blue-600 hover:underline text-sm">• .</a></li>
                <li><a href="#" className="text-gray-700 hover:text-blue-600 hover:underline text-sm">• .</a></li>
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 