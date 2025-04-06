'use client';

import React from 'react';
import Link from 'next/link';
import { BookOpen, Info } from 'lucide-react';

export default function HomeButtons() {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mt-10 justify-center">
      <Link 
        href="/wiki" 
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-lg font-medium flex items-center justify-center"
      >
        <BookOpen className="mr-2 h-5 w-5" />
        ページを見る
      </Link>
      <Link 
        href="/about"
        className="bg-white hover:bg-gray-100 text-blue-600 border border-blue-300 px-6 py-3 rounded-lg text-lg font-medium flex items-center justify-center"
      >
        <Info className="mr-2 h-5 w-5" />
        Wikiについて
      </Link>
    </div>
  );
} 