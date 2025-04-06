import React from "react";
import Link from "next/link";
import { getCategories } from "@/lib/data";
import Navigation from "@/components/Navigation";
import ContactForm from "@/components/ContactForm";

export const metadata = {
  title: "お問い合わせ | FIRST Program Japan Wiki",
  description: "FIRST Program Japan Wikiに関するご質問、ご提案などをお寄せください。",
};

export default async function ContactPage() {
  const categories = await getCategories();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation categories={categories} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">お問い合わせ</h1>
            <p className="text-lg text-gray-600">
              FIRST Program Japan Wikiに関するご質問、ご意見などをお寄せください。
            </p>
          </div>
          
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">お問い合わせについて</h2>
            <p className="text-gray-700 mb-4">
              FIRST Program Japan Wikiに関する以下のようなお問い合わせを受け付けています：
            </p>
            <ul className="list-disc pl-5 space-y-2 text-gray-700 mb-4">
              <li>Wiki内容に関する質問</li>
              <li>ページの作成・編集依頼</li>
              <li>不具合の報告</li>
              <li>改善提案</li>
              <li>その他のご意見・ご質問</li>
            </ul>
            <p className="text-gray-700">
              以下のフォームから、お気軽にお問い合わせください。内容を確認の上、担当者からご回答いたします。
            </p>
          </div>
          
          <ContactForm />
          
          <div className="mt-8 text-center">
            <Link href="/wiki" className="text-blue-600 hover:text-blue-800 font-medium">
              Wikiページ一覧に戻る
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
} 