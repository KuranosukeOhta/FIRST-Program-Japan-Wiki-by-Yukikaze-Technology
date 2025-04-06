'use client';

import React from 'react';
import { Filter } from 'lucide-react';
import Link from 'next/link';
import { getCategoryClassNames } from '@/utils/categoryColors';

interface CategoryFilterProps {
  currentCategory: string;
  categories: string[];
  clearCategoryLink: string;
  categoryBasePath?: string;
}

export default function CategoryFilter({ 
  currentCategory, 
  categories, 
  clearCategoryLink,
  categoryBasePath = '/wiki?category=' 
}: CategoryFilterProps) {
  return (
    <div className="w-full md:w-auto">
      <div className="bg-white p-4 border border-gray-300 rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-700">カテゴリで絞り込む</h3>
          <Filter className="h-5 w-5 text-gray-400" />
        </div>
        
        <div className="flex flex-wrap gap-2">
          {categories && categories.length > 0 ? (
            <>
              <Link
                href={clearCategoryLink}
                className={`px-3 py-1.5 text-sm rounded-full border ${
                  !currentCategory 
                    ? 'bg-blue-100 border-blue-300 text-blue-800 font-medium' 
                    : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                すべて
              </Link>
              
              {categories.map((category) => {
                const isActive = currentCategory === category;
                const categoryClasses = getCategoryClassNames(category);
                const [bgClass, textClass] = categoryClasses.split(' ');
                
                return (
                  <Link
                    key={category}
                    href={`${categoryBasePath}${encodeURIComponent(category)}`}
                    className={`px-3 py-1.5 text-sm rounded-full border ${
                      isActive 
                        ? `${bgClass} border-${textClass.replace('text-', '').replace('800', '300')} ${textClass} font-medium` 
                        : `bg-white border-gray-300 text-gray-600 hover:${bgClass.replace('bg-', 'bg-opacity-50 bg-')}`
                    }`}
                  >
                    {category}
                  </Link>
                );
              })}
            </>
          ) : (
            <p className="text-sm text-gray-500">カテゴリがありません</p>
          )}
        </div>
      </div>
    </div>
  );
} 