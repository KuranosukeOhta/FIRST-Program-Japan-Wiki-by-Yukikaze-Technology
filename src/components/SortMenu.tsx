"use client";

import React, { useState, useRef, useEffect } from "react";
import { Menu, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";

const sortOptions = [
  { label: "最新の更新順", value: "lastEdited" },
  { label: "タイトル順", value: "title" },
  { label: "作成日順", value: "created" },
];

const SortMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSort, setSelectedSort] = useState(sortOptions[0]);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // メニュー外クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSortChange = (option: typeof sortOptions[0]) => {
    setSelectedSort(option);
    setIsOpen(false);
    
    // 記事一覧ページにリダイレクト
    router.push(`/wiki?sort=${option.value}`);
  };

  return (
    <div className="bg-gray-300 p-3 mb-4 rounded" ref={menuRef}>
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-sm text-gray-700">並び替え: {selectedSort.label}</span>
        <ChevronDown className="h-4 w-4 text-gray-700" />
      </div>
      
      {isOpen && (
        <div className="mt-2 bg-white rounded shadow-md">
          {sortOptions.map((option) => (
            <div
              key={option.value}
              className={`px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer ${
                selectedSort.value === option.value ? "bg-blue-50 text-blue-600" : ""
              }`}
              onClick={() => handleSortChange(option)}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SortMenu; 