'use client';

import React from 'react';
import Link from 'next/link';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-100 border-t border-gray-200 py-8 mt-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">FIRST Program Japan Wiki</h3>
            <p className="text-gray-600 mb-4">
              FIRSTプログラム (For Inspiration and Recognition of Science and Technology) 
              に関する情報共有のためのウィキサイトです。
            </p>
            <p className="text-gray-600">
              © {currentYear} Yukikaze Technology
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">サイト内リンク</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/wiki" className="text-blue-600 hover:underline">
                  ページを見る
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-blue-600 hover:underline">
                  Wikiについて
                </Link>
              </li>
              <li>
                <Link href="/team" className="text-blue-600 hover:underline">
                  運営団体について
                </Link>
              </li>
              <li>
                <Link href="/edit" className="text-blue-600 hover:underline">
                  ページを書く
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-blue-600 hover:underline">
                  お問い合わせ
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">関連サイト</h3>
            <ul className="space-y-2">
              <li>
                <a 
                  href="https://www.firstinspires.org/" 
                  className="text-blue-600 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  FIRST公式サイト
                </a>
              </li>
              <li>
                <a 
                  href="https://www.firstjapan.jp/" 
                  className="text-blue-600 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  FIRST Japan公式サイト
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}; 