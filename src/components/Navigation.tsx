import Link from "next/link";
import React from "react";

interface NavigationProps {
  categories: string[];
  className?: string;
}

export default function Navigation({ categories, className = "" }: NavigationProps) {
  return (
    <div className={`bg-blue-50 shadow-sm border-b border-blue-100 ${className}`}>
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
            ページを書く
          </Link>
          <Link href="/contact" className="text-gray-700 hover:text-blue-600 font-medium py-2">
            お問い合わせ
          </Link>
        </div>
      </div>
    </div>
  );
} 