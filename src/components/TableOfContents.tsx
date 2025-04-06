"use client";

import React from 'react';

interface TableOfContentsProps {
  toc: {
    id: string;
    text: string;
    level: number;
    blockId: string;
  }[];
}

export default function TableOfContents({ toc }: TableOfContentsProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      // ヘッダーの高さ + 余白を考慮
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: elementPosition - offset,
        behavior: 'smooth'
      });
      // URLにハッシュを追加
      window.history.pushState(null, '', `#${id}`);
    }
  };

  return (
    <div className="bg-gray-300 p-4 rounded">
      <h3 className="text-lg font-medium mb-4">目次</h3>
      {toc.length > 0 ? (
        <ul className="space-y-2">
          {toc.map((item) => (
            <li key={item.id}>
              <a 
                href={`#${item.id}`} 
                className="text-gray-700 hover:text-blue-600 hover:underline text-sm"
                onClick={(e) => handleClick(e, item.id)}
              >
                • {item.text}
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500 text-sm">この記事には目次がありません</p>
      )}
    </div>
  );
} 