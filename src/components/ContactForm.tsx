"use client";

import React from "react";

export default function ContactForm() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 実装されていないため、ここでは単にコンソールログを出力
    console.log("フォームが送信されました（機能は実装されていません）");
    alert("申し訳ありません。この機能はまだ実装されていません。");
  };

  return (
    <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm">
      <div className="bg-yellow-50 p-4 rounded border-l-4 border-yellow-400 mb-6">
        <p className="text-gray-700">
          <span className="font-medium">注意：</span> このフォームは実装中です。現在は送信機能を提供していません。
        </p>
      </div>
      
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              お名前 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="山田 太郎"
              required
            />
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              メールアドレス <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="example@example.com"
              required
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
            件名 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="subject"
            name="subject"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="お問い合わせの件名"
            required
          />
        </div>
        
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            お問い合わせ種別 <span className="text-red-500">*</span>
          </label>
          <select
            id="category"
            name="category"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">選択してください</option>
            <option value="question">Wiki内容に関する質問</option>
            <option value="edit">ページの作成・編集依頼</option>
            <option value="report">不具合の報告</option>
            <option value="suggestion">改善提案</option>
            <option value="other">その他</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
            お問い合わせ内容 <span className="text-red-500">*</span>
          </label>
          <textarea
            id="message"
            name="message"
            rows={6}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="お問い合わせ内容を詳しくご記入ください"
            required
          ></textarea>
        </div>
        
        <div className="flex items-start">
          <input
            id="privacy"
            name="privacy"
            type="checkbox"
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
            required
          />
          <label htmlFor="privacy" className="ml-2 block text-sm text-gray-700">
            <span className="text-red-500">*</span> プライバシーポリシーに同意します。個人情報は、お問い合わせへの対応のみに使用し、第三者に提供することはありません。
          </label>
        </div>
        
        <div className="text-center">
          <button
            type="submit"
            className="inline-flex justify-center py-3 px-6 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            送信する
          </button>
        </div>
      </form>
    </div>
  );
} 