// カテゴリごとに異なる色を定義
type CategoryColorScheme = {
  bg: string;
  text: string;
};

// 各カテゴリに対する色のマッピング
const CATEGORY_COLORS: Record<string, CategoryColorScheme> = {
  'FRC': { bg: 'bg-red-100', text: 'text-red-800' },
  'FTC': { bg: 'bg-orange-100', text: 'text-orange-800' },
  'FLL': { bg: 'bg-green-100', text: 'text-green-800' },
  'チュートリアル': { bg: 'bg-purple-100', text: 'text-purple-800' },
  'イベント': { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  'その他': { bg: 'bg-gray-100', text: 'text-gray-800' },
  'レポート': { bg: 'bg-teal-100', text: 'text-teal-800' },
  'ニュース': { bg: 'bg-pink-100', text: 'text-pink-800' },
  'インタビュー': { bg: 'bg-indigo-100', text: 'text-indigo-800' },
  'ガイド': { bg: 'bg-blue-100', text: 'text-blue-800' },
  'ハードウェア': { bg: 'bg-amber-100', text: 'text-amber-800' },
  'ソフトウェア': { bg: 'bg-cyan-100', text: 'text-cyan-800' },
};

// デフォルトの色
const DEFAULT_COLOR: CategoryColorScheme = { bg: 'bg-blue-100', text: 'text-blue-800' };

/**
 * カテゴリに対応する色のスキームを取得する
 * @param category カテゴリ名
 * @returns 色のスキーム（背景色とテキスト色）
 */
export function getCategoryColors(category: string): CategoryColorScheme {
  return CATEGORY_COLORS[category] || DEFAULT_COLOR;
}

/**
 * カテゴリに対応するクラス名を取得する
 * @param category カテゴリ名
 * @returns 結合されたクラス名
 */
export function getCategoryClassNames(category: string): string {
  const colors = getCategoryColors(category);
  return `${colors.bg} ${colors.text}`;
} 