import React from "react";
import Link from "next/link";
import { getCategories } from "@/lib/data";
import Navigation from "@/components/Navigation";

export const metadata = {
  title: '運営団体について | FIRST Program Japan Wiki',
  description: 'FIRST Program Japan Wikiを運営する団体についての情報ページです。',
};

export default async function TeamPage() {
  const categories = await getCategories();
  
  return (
    <div className="bg-white">
      {/* ナビゲーションコンポーネント */}
      <Navigation categories={categories} />
      
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">運営団体について</h1>
        
        <div className="bg-blue-50 p-6 rounded-lg shadow-sm mb-10">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Yukikaze Technology について</h2>
          <p className="text-gray-600 mb-4">
            Yukikaze Technologyは、日本の若者に科学技術やロボティクスの面白さを伝え、次世代のイノベーターを育成することを目指す団体です。
            FIRSTプログラムの日本での普及・発展のために、様々な活動を行っています。
          </p>
          <p className="text-gray-600">
            2022年に設立され、FIRST関連イベントの開催支援、教育機関への働きかけ、情報提供などを通じて、
            日本におけるSTEM教育の支援と発展に取り組んでいます。
          </p>
        </div>
        
        <div className="space-y-8">
          <section className="bg-white p-6 rounded-lg border border-gray-200">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">主な活動</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li>FIRSTプログラム参加チームへの技術サポートとメンタリング</li>
              <li>ロボティクスワークショップの開催</li>
              <li>教育者向けのFIRSTプログラム紹介セミナー</li>
              <li>FIRST Japan Wikiの運営・管理</li>
              <li>企業・団体とのパートナーシップ構築</li>
            </ul>
          </section>
          
          <section className="bg-white p-6 rounded-lg border border-gray-200">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Wiki運営チーム</h2>
            <p className="text-gray-600 mb-4">
              FIRST Program Japan Wikiは、以下のメンバーを中心とした運営チームによって管理・運営されています。
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-800 mb-2">コンテンツ管理チーム</h3>
                <p className="text-gray-600 text-sm">
                  Wikiの記事内容を管理し、正確性と品質を確保します。投稿された記事のレビューや編集も担当します。
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-800 mb-2">システム開発チーム</h3>
                <p className="text-gray-600 text-sm">
                  Wiki自体のシステム開発と保守を担当します。使いやすいインターフェースと安定したサービスの提供を目指しています。
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-800 mb-2">コミュニティ支援チーム</h3>
                <p className="text-gray-600 text-sm">
                  利用者からの質問対応や、コミュニティ間の交流を促進する活動を行います。
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-800 mb-2">広報チーム</h3>
                <p className="text-gray-600 text-sm">
                  Wikiの認知度向上と利用促進のための広報活動を担当します。
                </p>
              </div>
            </div>
          </section>
          
          <section className="bg-white p-6 rounded-lg border border-gray-200">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">お問い合わせ</h2>
            <p className="text-gray-600 mb-4">
              運営団体またはWikiについてのお問い合わせは、以下のリンクからお願いします。
            </p>
            <div className="mt-4">
              <Link 
                href="/contact" 
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md transition-colors"
              >
                お問い合わせフォーム
              </Link>
            </div>
          </section>
        </div>
        
        <div className="mt-12 text-center">
          <Link 
            href="/wiki" 
            className="inline-block text-blue-600 hover:text-blue-800 font-medium hover:underline"
          >
            ウィキページ一覧に戻る
          </Link>
        </div>
      </div>
    </div>
  );
} 