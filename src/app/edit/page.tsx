import React from "react";
import Link from "next/link";
import { getCategories } from "@/lib/data";
import Navigation from "@/components/Navigation";

export const metadata = {
  title: 'ページを書く | FIRST Program Japan Wiki',
  description: 'FIRST Program Japan Wikiにページを作成・編集する方法についての説明ページです。',
};

export default async function EditPage() {
  const categories = await getCategories();
  
  return (
    <div className="bg-white">
      {/* ナビゲーションコンポーネント */}
      <Navigation categories={categories} />
      
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">ページを書く</h1>
        
        <div className="bg-blue-50 p-6 rounded-lg shadow-sm mb-10">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Wikiへの貢献について</h2>
          <p className="text-gray-600 mb-4">
            FIRST Program Japan Wikiは、コミュニティによって作られる共同プロジェクトです。
            皆さんが持つ知識や経験を共有していただくことで、より充実したリソースとなります。
          </p>
          <p className="text-gray-600">
            新しいページの作成や既存ページの編集にご協力いただける方は、以下の手順をご参照ください。
          </p>
        </div>
        
        <div className="space-y-8">
          <section className="bg-white p-6 rounded-lg border border-gray-200">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">編集の準備</h2>
            <div className="space-y-4">
              <div className="bg-yellow-50 p-4 rounded border-l-4 border-yellow-400">
                <p className="text-gray-700">
                  <span className="font-medium">注意：</span> このページは実装中です。現在は直接編集機能を提供していません。
                  ページの編集をご希望の場合は、お問い合わせフォームからご連絡ください。
                </p>
              </div>
              <h3 className="font-medium text-gray-800">アカウント登録</h3>
              <ol className="list-decimal pl-6 space-y-2 text-gray-600">
                <li>将来的には、登録アカウントを通じて編集できるようになります</li>
                <li>現時点では、運営チームに編集内容をご提案ください</li>
              </ol>
            </div>
          </section>
          
          <section className="bg-white p-6 rounded-lg border border-gray-200">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">ページ作成・編集のガイドライン</h2>
            <div className="space-y-4">
              <h3 className="font-medium text-gray-800">基本方針</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-600">
                <li>正確な情報を心がけてください</li>
                <li>第三者の著作権を侵害する内容は投稿しないでください</li>
                <li>公序良俗に反する内容は控えてください</li>
                <li>特定の個人や団体を誹謗中傷する内容は避けてください</li>
                <li>商業的な宣伝行為は控えてください</li>
              </ul>
              
              <h3 className="font-medium text-gray-800 mt-6">望ましい記事の構成</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-600">
                <li>明確なタイトルと概要</li>
                <li>適切な見出し構造</li>
                <li>分かりやすい文章と説明</li>
                <li>関連情報や参考リンク</li>
                <li>図表や画像（著作権に配慮してください）</li>
              </ul>
              
              <h3 className="font-medium text-gray-800 mt-6">カテゴリ分類</h3>
              <p className="text-gray-600">
                記事作成時は、適切なカテゴリを選択してください。現在、以下のカテゴリがあります：
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {categories && categories.length > 0 ? (
                  categories.map((category, index) => (
                    <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                      {category}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500 italic">カテゴリ情報を読み込み中...</span>
                )}
              </div>
            </div>
          </section>
          
          <section className="bg-white p-6 rounded-lg border border-gray-200">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">編集内容の提案</h2>
            <p className="text-gray-600 mb-4">
              新しいページの作成や既存ページの編集をご希望の場合は、以下の情報を含めてお問い合わせください：
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li>ページのタイトル</li>
              <li>ページの内容（テキスト形式）</li>
              <li>カテゴリ</li>
              <li>参考資料やリンク</li>
            </ul>
            <div className="mt-6">
              <Link 
                href="/contact" 
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md transition-colors"
              >
                編集内容を提案する
              </Link>
            </div>
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