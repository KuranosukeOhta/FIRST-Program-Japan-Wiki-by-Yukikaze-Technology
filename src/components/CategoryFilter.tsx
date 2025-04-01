'use client';

import React from 'react';
import { Filter } from 'lucide-react';
import Link from 'next/link';

interface CategoryFilterProps {
  currentCategory: string;
  categories: string[];
  getClearCategoryLink: () => string;
  generateCategoryLink: (category: string) => string;
}

export default function CategoryFilter({
  currentCategory,
  categories,
  getClearCategoryLink,
  generateCategoryLink
}: CategoryFilterProps) {
  return (
    <div className="w-full md:w-auto">
      {currentCategory ? (
        <div className="flex">
          <div className="flex items-center bg-blue-50 border border-blue-200 rounded-l-lg px-4 py-3">
            <Filter className="h-5 w-5 text-blue-600 mr-2" />
            <span className="font-medium text-blue-800">{currentCategory}</span>
          </div>
          <Link
            href={getClearCategoryLink()}
            className="bg-white hover:bg-gray-50 text-red-600 border border-l-0 border-gray-300 rounded-r-lg py-3 px-4 flex items-center"
          >
            解除
          </Link>
        </div>
      ) : (
        <div className="relative inline-block w-full">
          <select
            id="categoryFilter"
            className="w-full bg-white border border-gray-300 rounded-lg py-3 px-4 pr-8 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) {
                window.location.href = generateCategoryLink(e.target.value);
              }
            }}
          >
            <option value="" disabled>カテゴリーで絞り込み</option>
            {categories.map((category: string) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <Filter className="h-5 w-5 text-gray-400" />
          </div>
        </div>
      )}
    </div>
  );
} 