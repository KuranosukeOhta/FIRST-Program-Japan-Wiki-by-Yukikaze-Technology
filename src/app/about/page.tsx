import React from "react";
import Link from "next/link";
import { getCategories } from "@/lib/data";
import Navigation from "@/components/Navigation";
import { generateMetadata } from "@/utils/metadata";

export const metadata = generateMetadata({
  title: 'Wikiについて',
  description: 'FIRST Program Japanのウィキサイトについての説明ページです。運営目的や特徴、参加方法について解説しています。',
  pathName: '/about',
  keywords: ['Wiki', '参加方法', 'ライセンス', '目的', '特徴'],
  ogType: 'website',
});

export default async function AboutPage() {
  const categories = await getCategories();
  
  return (
    <div className="bg-white">
      {/* ナビゲーションコンポーネント */}
      <Navigation categories={categories} />
      
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">FIRST Program Japan Wikiについて</h1>
        
        <div className="bg-blue-50 p-6 rounded-lg shadow-sm mb-10">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">このWikiの目的</h2>
          <p className="text-gray-600 mb-4">
            FIRST Program Japan Wikiは、日本におけるFIRST（For Inspiration and Recognition of Science and Technology）
            プログラムに関する知識や経験、ノウハウを共有するためのプラットフォームです。
          </p>
          <p className="text-gray-600">
            FRC、FTC、FLLなどの各プログラムに参加するチームや指導者、メンターが情報を持ち寄り、日本語で利用できる
            リソースを充実させることを目指しています。
          </p>
        </div>
        
        <div className="space-y-8">
          <section className="bg-white p-6 rounded-lg border border-gray-200">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">特徴</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li>日本語での技術情報やルール解説</li>
              <li>各プログラムの概要と特徴の解説</li>
              <li>チーム運営のためのノウハウ共有</li>
              <li>大会参加に向けたヒントとアドバイス</li>
              <li>日本国内での活動やイベント情報</li>
            </ul>
          </section>
          
          <section className="bg-white p-6 rounded-lg border border-gray-200">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">参加方法</h2>
            <p className="text-gray-600 mb-4">
              FIRST Programに関する知識や経験をお持ちの方は、どなたでもWikiに情報を追加することができます。
              新しいページの作成や既存ページの編集には、簡単な登録が必要です。
            </p>
            <div className="mt-4">
              <Link 
                href="/edit" 
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md transition-colors"
              >
                ページを書く
              </Link>
            </div>
          </section>
          
          <section className="bg-white p-6 rounded-lg border border-gray-200">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">ライセンスと著作権</h2>
            <p className="text-gray-600 mb-2">
              このWikiに掲載されている情報は、特に明記がない限り、クリエイティブ・コモンズ 表示-非営利 4.0 国際 ライセンスのもとで提供されています。
            </p>
            <p className="text-gray-600">
              FIRST®、FRC®、FTC®、FLL®などの名称とロゴは、FIRST（For Inspiration and Recognition of Science and Technology）の登録商標です。
            </p>
          </section>
        </div>
        
        <div className="mt-12 text-center">
          <Link 
            href="/wiki" 
            className="inline-block text-blue-600 hover:text-blue-800 font-medium hover:underline"
          >
            ページ一覧に戻る
          </Link>
        </div>
      </div>
    </div>
  );
} 