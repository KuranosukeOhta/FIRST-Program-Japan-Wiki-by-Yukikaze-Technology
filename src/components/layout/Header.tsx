'use client';

import React from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="bg-blue-700 text-white py-4 shadow-md">
      <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between">
        <div className="mb-4 sm:mb-0">
          <Link href="/" className="text-xl sm:text-2xl font-bold flex items-center">
            <span className="mr-2">🤖</span> 
            FIRST Program Japan Wiki
          </Link>
          <p className="text-blue-200 text-sm sm:text-base">
            by Yukikaze Technology
          </p>
        </div>
        
        <div className="flex items-center w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Wiki検索..."
              className="bg-blue-600 text-white placeholder-blue-300 border border-blue-500 rounded-lg py-2 px-4 pr-10 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <Search className="h-5 w-5 text-blue-300" />
            </div>
          </div>
          
          <a href="#" onClick={(e) => e.preventDefault()} className="ml-4 bg-blue-800 hover:bg-blue-900 px-4 py-2 rounded-lg hidden sm:block">
            管理画面
          </a>
        </div>
      </div>
    </header>
  );
}; 