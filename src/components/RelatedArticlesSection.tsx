"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import SortMenu from "@/components/SortMenu";

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
export default function RelatedArticlesSection({ relatedPages }: RelatedArticlesSectionProps) {
  const [sortedPages, setSortedPages] = useState<RelatedPage[]>([]);
  const [currentSort, setCurrentSort] = useState("lastEdited");

  // 初期データがロードされたときと並び替えが変更されたときに実行
  useEffect(() => {
    if (!relatedPages || relatedPages.length === 0) {
      setSortedPages([]);
      return;
    }
    
    sortPages(currentSort, relatedPages);
  }, [relatedPages, currentSort]);

  // 並べ替え処理
  const sortPages = (sortValue: string, pages: RelatedPage[]) => {
    const newSortedPages = [...pages];
    
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

  // 並び替え変更ハンドラー
  const handleSortChange = (sortValue: string) => {
    setCurrentSort(sortValue);
  };

  return (
    <>
      {/* 関連記事の並び替えメニュー - 関連記事がある場合のみ表示 */}
      {relatedPages && relatedPages.length > 0 && (
        <SortMenu 
          mode="related" 
          onSortChange={handleSortChange} 
          title="関連記事の並び替え"
          initialSort={currentSort} 
        />
      )}
      
      {/* 関連記事一覧 */}
      <div className="bg-blue-50 p-3 mb-4 rounded shadow-sm">
        <h3 className="text-center text-gray-700 font-medium mb-3">関連記事</h3>
        
        {sortedPages.length > 0 ? (
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