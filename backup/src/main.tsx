import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'

// グローバルエラーハンドラーを追加
window.addEventListener('error', (event) => {
  console.error('グローバルエラー:', event.error);
  
  // エラー情報を画面に表示
  const errorDiv = document.createElement('div');
  errorDiv.style.position = 'fixed';
  errorDiv.style.bottom = '0';
  errorDiv.style.left = '0';
  errorDiv.style.right = '0';
  errorDiv.style.backgroundColor = 'rgba(255, 0, 0, 0.8)';
  errorDiv.style.color = 'white';
  errorDiv.style.padding = '10px';
  errorDiv.style.zIndex = '9999';
  errorDiv.style.fontSize = '12px';
  errorDiv.style.maxHeight = '200px';
  errorDiv.style.overflow = 'auto';
  errorDiv.style.whiteSpace = 'pre-wrap';
  
  errorDiv.innerHTML = `
    <strong>アプリケーションでエラーが発生しました:</strong><br>
    ${event.error?.message || 'エラーメッセージなし'}<br>
    ${event.error?.stack?.replace(/\n/g, '<br>') || 'スタック情報なし'}
  `;
  
  document.body.appendChild(errorDiv);
  
  // 60秒後に自動で消える
  setTimeout(() => {
    try {
      document.body.removeChild(errorDiv);
    } catch (e) {
      // エラー表示が既に削除されている場合は無視
    }
  }, 60000);
});

// 環境変数をコンソールに出力（デバッグ用）
console.log('環境変数:', {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? '設定済み' : '未設定'
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)