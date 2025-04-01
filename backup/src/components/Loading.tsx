import React from 'react';
import { Loader2 as Loader2Icon } from 'lucide-react';

interface LoadingProps {
  message: string;
  size?: 'small' | 'medium' | 'large';
}

// スタイル付きのローダーコンポーネント
export const CustomLoader = ({
  message,
  size = 'medium',
}: LoadingProps) => {
  // サイズに基づくスタイルの設定
  const sizeStyles = {
    small: {
      container: 'h-16',
      icon: 'w-6 h-6',
      text: 'text-sm'
    },
    medium: {
      container: 'h-32',
      icon: 'w-12 h-12',
      text: 'text-base'
    },
    large: {
      container: 'h-64',
      icon: 'w-16 h-16',
      text: 'text-lg'
    }
  };

  const styles = sizeStyles[size];

  return (
    <div className={`flex justify-center items-center ${styles.container}`}>
      <div className="flex flex-col items-center">
        <Loader2Icon className={`${styles.icon} animate-spin text-indigo-500`} />
        <span className={`mt-4 text-gray-600 ${styles.text}`}>{message}</span>
      </div>
    </div>
  );
};

// 進捗状態付きのローディング表示
export const ProgressLoading = ({
  message,
  progress,
}: {
  message: string;
  progress?: number; // 0-100の数値
}) => {
  return (
    <div className="flex flex-col items-center justify-center h-64">
      <div className="w-16 h-16 relative">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-indigo-500 border-solid"></div>
        {progress !== undefined && (
          <div className="absolute top-0 left-0 flex items-center justify-center w-full h-full">
            <span className="text-xs font-medium">{progress}%</span>
          </div>
        )}
      </div>
      <span className="mt-4 text-gray-600">{message}</span>
      {progress !== undefined && (
        <div className="w-64 h-2 mt-4 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-indigo-500 rounded-full transition-all duration-300 ease-in-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}
    </div>
  );
};

// デフォルトエクスポート
export default CustomLoader; 