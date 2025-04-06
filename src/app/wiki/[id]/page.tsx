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

// カテゴリリスト（実際のアプリではデータから取得）
const categories = [
  { id: "1", name: "カテゴリ1" },
  { id: "2", name: "カテゴリ2" },
  { id: "3", name: "カテゴリ3" },
  { id: "4", name: "カテゴリ4" },
  { id: "5", name: "カテゴリ5" }
];

// 著者リスト（ダミーデータ）
const authors = Array(6).fill(null).map((_, i) => ({
  id: `author-${i+1}`,
  name: "著者名",
  avatar: null
}));

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
    <div>
      {/* ヘッダーエリア */}
      <div className="bg-gray-200 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">
            <Link href="/">FIRST Program Japan Wiki</Link>
          </h1>
          <div className="w-80 bg-gray-200 p-3">
            <div className="bg-gray-100 p-2 rounded text-center">Wiki全体の検索バー</div>
          </div>
        </div>
      </div>
      
      {/* ナビゲーションメニュー */}
      <div className="bg-gray-300 p-3">
        <div className="max-w-7xl mx-auto flex space-x-6">
          <Link href="/" className="text-gray-800 hover:underline">ページを見る</Link>
          <Link href="/about" className="text-gray-800 hover:underline">Wikiについて</Link>
          <Link href="/team" className="text-gray-800 hover:underline">運営団体について</Link>
          <Link href="/edit" className="text-gray-800 hover:underline">記事を書く</Link>
          <Link href="/contact" className="text-gray-800 hover:underline">お問い合わせ</Link>
        </div>
      </div>
      
      {/* メインコンテンツエリア - Figmaデザインのレイアウト */}
      <div className="max-w-7xl mx-auto mt-4 flex">
        {/* 左サイドバー - カテゴリと記事著者 */}
        <div className="w-64 flex-shrink-0">
          {/* カテゴリメニュー */}
          <div className="bg-yellow-300 p-4 mb-4">
            <ul>
              {categories.map((category) => (
                <li key={category.id} className="mb-1">
                  <Link href={`/category/${category.id}`} className="block text-gray-800 hover:underline">
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-4 text-center text-gray-700 text-sm">
              ※本当は何もない部分、カテゴリメニューは上に表示される
            </div>
          </div>
          
          {/* 記事検索バー */}
          <div className="bg-gray-200 p-3 mb-4 rounded">
            <span className="block text-center">記事検索バー</span>
          </div>
          
          {/* 並び替えメニュー */}
          <div className="bg-gray-200 p-2 mb-4 flex items-center justify-between rounded">
            <span className="text-sm">並び替えメニュー</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </div>
          
          {/* 記事著者リスト */}
          {authors.map((author) => (
            <div key={author.id} className="bg-gray-200 p-3 mb-4 flex rounded">
              <div className="w-1/4 mr-2">
                <div className="bg-blue-400 rounded-full w-10 h-10"></div>
              </div>
              <div className="flex-1">
                <p className="text-center mb-2 text-sm">記事者名</p>
                <p className="text-blue-500 text-sm text-center">著者名</p>
              </div>
            </div>
          ))}
        </div>
        
        {/* メインコンテンツ */}
        <div className="flex-1 mx-6">
          <div className="bg-gray-200 p-3 mb-4 rounded">
            <h1 className="text-2xl font-bold text-center">{page.title}</h1>
          </div>
          
          <div className="bg-gray-200 p-6 rounded">
            {/* 実際のNotion APIから取得したデータを表示 */}
            <div className="prose max-w-none">
              <NotionContent blocks={blocks || []} />
            </div>
            
            {/* 静的なデモコンテンツ（実データがない場合のフォールバック） */}
            {(!blocks || blocks.length === 0) && (
              <>
                <h2 className="text-xl font-bold mb-4">はじめに</h2>
                <p className="mb-4">
                  先日、Next.jsの勉強会で、データベース連携の実装について取り上げました 🔄
                </p>
                <ul className="list-disc ml-6 mb-4">
                  <li className="mb-2">Supabase</li>
                  <li className="mb-2">Firebase</li>
                </ul>
                <p className="mb-4">
                  上記などは、有名でしょうか。<br />
                  自前での構築不要で、簡単に DB を導入できるサービスは、新規プロダクトの立ち上げにおいて、便利です。<br />
                  その中でも、今回はNeon DB について調査したので、基礎的な内容をまとめました！
                </p>
                <p className="mb-4">
                  時間の節約になれば、嬉しいです 🙌
                </p>
                <h2 className="text-xl font-bold mb-4">Neon（旧 Vercel PostgreSQL）とは？</h2>
                <p className="mb-4">
                  Neon は、サーバーレスで設計された PostgreSQL データベースサービスです。<br />
                  簡単に、DB を構築し、アプリに連携することができます！
                </p>
                <p className="mb-4">特徴は、：</p>
                <ul className="list-disc ml-6 mb-4">
                  <li className="mb-2">サーバーレスアーキテクチャ: インフラ管理が不要で、使用した分だけ支払う（無料から OK）</li>
                  <li className="mb-2">Git 風のブランチ機能: 本番 DB から開発・テスト用の環境を瞬時に作成可能</li>
                  <li className="mb-2">スケーラビリティ: 使用量に応じて自動的にスケール</li>
                  <li className="mb-2">高速: 最新のストレージ技術による高速なパフォーマンス</li>
                  <li className="mb-2">Vercel 統合: Vercel プロジェクトとの簡単な連携</li>
                </ul>
                <p className="mb-4">
                  以前は、Next.js の公式チュートリアルにも登場する、「Vercel PostgreSQL」として、提供されていました。<br />
                  現在は、Neon ブランドとして独立し、Vercel の marketplace から利用できます！
                </p>
              </>
            )}
          </div>
        </div>
        
        {/* 右サイドバー - 著者情報と目次 */}
        <div className="w-64 flex-shrink-0">
          {/* 著者情報 */}
          <div className="bg-gray-200 p-4 mb-4 rounded">
            <div className="flex flex-col items-center mb-4">
              <div className="bg-blue-400 rounded-full w-16 h-16 mb-2"></div>
              <h3 className="text-lg font-bold">著者名</h3>
            </div>
            <p className="text-center text-sm mb-4">プロフィール内容</p>
          </div>
          
          {/* 目次 */}
          <div className="bg-gray-200 p-4 rounded">
            <h3 className="text-lg font-bold mb-4">目次</h3>
            {toc.length > 0 ? (
              <ul className="space-y-2">
                {toc.map((item) => (
                  <li key={item.id} style={{ paddingLeft: `${(item.level - 1) * 0.75}rem` }}>
                    <a href={`#${item.id}`} className="text-gray-800 hover:underline text-sm">
                      • {item.text}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-800 hover:underline text-sm">• はじめに</a></li>
                <li><a href="#" className="text-gray-800 hover:underline text-sm">• .</a></li>
                <li><a href="#" className="text-gray-800 hover:underline text-sm">• .</a></li>
                <li><a href="#" className="text-gray-800 hover:underline text-sm">• .</a></li>
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 