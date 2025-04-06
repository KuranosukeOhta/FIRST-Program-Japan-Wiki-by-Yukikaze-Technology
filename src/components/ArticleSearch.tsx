"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

const ArticleSearch = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/wiki?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <div className="bg-blue-50 p-4 mb-4 rounded shadow-sm">
      <h3 className="text-center text-gray-700 font-medium mb-2">ページ検索</h3>
      <form onSubmit={handleSearch} className="relative">
        <input
          type="text"
          className="w-full bg-white rounded px-3 py-2 pr-8 text-sm"
          placeholder="ページを検索..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button 
          type="submit" 
          className="absolute right-2 top-2 bg-transparent border-none p-0"
          aria-label="検索"
        >
          <Search className="h-4 w-4 text-gray-400" />
        </button>
      </form>
    </div>
  );
};

export default ArticleSearch; 