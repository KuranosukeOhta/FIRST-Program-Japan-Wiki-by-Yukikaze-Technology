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
    <div className="bg-white shadow p-4 rounded sticky top-4">
      <h3 className="text-lg font-medium mb-4 text-gray-800">目次</h3>
      <ul className="space-y-2">
        {toc.map((item) => {
          // levelに応じたインデントを適用
          const indentClass = item.level === 1 ? '' : item.level === 2 ? 'ml-3' : 'ml-6';
          return (
            <li key={item.id} className={indentClass}>
              <a 
                href={`#${item.id}`} 
                className="text-gray-700 hover:text-blue-600 hover:underline text-sm flex items-start"
                onClick={(e) => handleClick(e, item.id)}
              >
                <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mt-1.5 mr-2 flex-shrink-0"></span>
                <span>{item.text}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
} 