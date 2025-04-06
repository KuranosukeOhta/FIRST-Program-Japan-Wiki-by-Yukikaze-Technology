import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './components/HomePage';
import AllPages from './components/AllPages';
import PageDetail from './components/PageDetail';
import CategoryPages from './components/CategoryPages';
import SearchResults from './components/SearchResults';
import NotionPageDetail from './components/NotionPageDetail';
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

// Aboutページコンポーネント（簡易版）
const AboutPage = () => {
  return (
    <div className="prose max-w-none">
      <h1>このWikiについて</h1>
      <p>
        FIRST Program Japan Wikiは、FIRSTプログラムに参加するチームや個人が知識を共有し、
        日本のSTEM教育の発展に貢献することを目的としています。
      </p>
      <p>
        このサイトは、チームが直面する様々な課題や解決策、ベストプラクティスを集めた
        知識ベースとして機能することを目指しています。
      </p>
      <p>
        コンテンツはNotionデータベースで管理されており、継続的に更新・拡張されています。
      </p>
      <h2>コンテンツ提供のお願い</h2>
      <p>
        このWikiは皆様の貢献によって成り立っています。新しいページの提案や既存ページの
        改善提案は大歓迎です。ご協力をお願いいたします。
      </p>
    </div>
  );
};

// 404ページコンポーネント
const NotFoundPage = () => (
  <div className="bg-white rounded-lg shadow-md p-8 text-center">
    <h1 className="text-3xl font-bold text-gray-900 mb-4">404 - ページが見つかりません</h1>
    <p className="text-lg text-gray-600 mb-6">
      お探しのページは存在しないか、移動した可能性があります。
    </p>
    <a
      href="/"
      className="inline-block bg-indigo-600 text-white px-5 py-3 rounded-md font-medium hover:bg-indigo-700"
    >
      ホームに戻る
    </a>
  </div>
);

// デバッグ用の関数
const saveDebugData = (key: string, data: any) => {
  try {
    // LocalStorageに保存
    localStorage.setItem(`debug_${key}`, JSON.stringify(data));
    
    // コンソールにも出力
    console.log(`デバッグデータ [${key}]:`, data);
    
    // 開発環境の場合はさらに詳細情報を表示
    if (import.meta.env.DEV) {
      console.group(`デバッグ詳細 - ${key}`);
      if (data.categories) console.log('カテゴリー:', data.categories);
      if (data.debug) console.log('デバッグ情報:', data.debug);
      console.groupEnd();
    }
  } catch (error) {
    console.error('デバッグデータの保存に失敗しました:', error);
  }
};

// グローバルにデバッグ関数を公開（コンソールからアクセス可能に）
if (import.meta.env.DEV) {
  (window as any).__debug = {
    saveDebugData,
    getAllDebugData: () => {
      const debugData: Record<string, any> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('debug_')) {
          try {
            debugData[key.replace('debug_', '')] = JSON.parse(localStorage.getItem(key) || '{}');
          } catch (e) {
            debugData[key.replace('debug_', '')] = localStorage.getItem(key);
          }
        }
      }
      return debugData;
    },
    clearDebugData: () => {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('debug_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      console.log(`${keysToRemove.length}件のデバッグデータをクリアしました`);
    }
  };
  console.log('デバッグモードが有効です。window.__debug でデバッグ機能にアクセスできます');
}

// タイトルを管理するコンポーネント
const TitleManager = () => {
  const location = useLocation();
  
  useEffect(() => {
    let title = "FIRST Program Japan Wiki";
    
    // パスに基づいてタイトルを設定
    if (location.pathname === '/') {
      title = "FIRST Program Japan Wiki - ホーム";
    } else if (location.pathname.startsWith('/page/')) {
      // 詳細ページではタイトルは動的に設定されるため、初期値のまま
    } else if (location.pathname.startsWith('/all-pages')) {
      title = "すべてのページ | FIRST Program Japan Wiki";
    } else if (location.pathname.startsWith('/category/')) {
      const category = decodeURIComponent(location.pathname.split('/')[2] || '');
      title = `${category}カテゴリ | FIRST Program Japan Wiki`;
    } else if (location.pathname.startsWith('/search')) {
      const query = new URLSearchParams(location.search).get('q');
      title = query 
        ? `「${query}」の検索結果 | FIRST Program Japan Wiki` 
        : "検索 | FIRST Program Japan Wiki";
    } else if (location.pathname === '/about') {
      title = "このWikiについて | FIRST Program Japan Wiki";
    }
    
    // タイトルを設定
    document.title = title;
  }, [location]);
  
  return null;
};

function App() {
  // 初期化時にデバッグモードの設定
  useEffect(() => {
    // URLにdebugパラメータがあればデバッグモードを有効化
    const urlParams = new URLSearchParams(window.location.search);
    const debug = urlParams.get('debug');
    if (debug === 'true') {
      console.log('デバッグモードが有効化されました (URL parameter)');
      localStorage.setItem('debug_mode', 'true');
    }
  }, []);

  return (
    <>
      <TitleManager />
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/page/:pageId" element={<PageDetail />} />
          <Route path="/all-pages" element={<AllPages />} />
          <Route path="/category/:categoryName" element={<CategoryPages />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/about" element={<AboutPage />} />
          
          {/* 後方互換性のために古いルートも残す */}
          <Route path="/pages/:pageId" element={<NotionPageDetail />} />
          
          {/* 404ページ */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Layout>
      <Analytics />
      <SpeedInsights />
    </>
  );
}

export default App;