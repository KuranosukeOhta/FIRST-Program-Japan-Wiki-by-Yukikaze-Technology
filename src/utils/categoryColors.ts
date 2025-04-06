// カテゴリごとに異なる色を定義
type CategoryColorScheme = {
  bg: string;
  text: string;
};

// 利用可能な色のパレット（背景色と対応するテキスト色のペア）
const COLOR_PALETTE: CategoryColorScheme[] = [
  { bg: 'bg-red-100', text: 'text-red-800' },
  { bg: 'bg-orange-100', text: 'text-orange-800' },
  { bg: 'bg-amber-100', text: 'text-amber-800' },
  { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  { bg: 'bg-lime-100', text: 'text-lime-800' },
  { bg: 'bg-green-100', text: 'text-green-800' },
  { bg: 'bg-emerald-100', text: 'text-emerald-800' },
  { bg: 'bg-teal-100', text: 'text-teal-800' },
  { bg: 'bg-cyan-100', text: 'text-cyan-800' },
  { bg: 'bg-sky-100', text: 'text-sky-800' },
  { bg: 'bg-blue-100', text: 'text-blue-800' },
  { bg: 'bg-indigo-100', text: 'text-indigo-800' },
  { bg: 'bg-violet-100', text: 'text-violet-800' },
  { bg: 'bg-purple-100', text: 'text-purple-800' },
  { bg: 'bg-fuchsia-100', text: 'text-fuchsia-800' },
  { bg: 'bg-pink-100', text: 'text-pink-800' },
  { bg: 'bg-rose-100', text: 'text-rose-800' },
];

// 既存の主要カテゴリに対する固定マッピング（互換性のため維持）
const CATEGORY_COLORS: Record<string, CategoryColorScheme> = {
  'チーム管理': { bg: 'bg-red-100', text: 'text-red-800' },
  '数学': { bg: 'bg-orange-100', text: 'text-orange-800' },
  'プログラミング': { bg: 'bg-green-100', text: 'text-green-800' },
  'ロボット製作': { bg: 'bg-purple-100', text: 'text-purple-800' },
  '運営': { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  '大会参加': { bg: 'bg-gray-100', text: 'text-gray-800' },
  '広報': { bg: 'bg-teal-100', text: 'text-teal-800' },
  '資金/会計': { bg: 'bg-pink-100', text: 'text-pink-800' },
  'アウトリーチ': { bg: 'bg-indigo-100', text: 'text-indigo-800' },
  'プロジェクト': { bg: 'bg-blue-100', text: 'text-blue-800' },
  '資料作成': { bg: 'bg-amber-100', text: 'text-amber-800' },
  'インタビュー': { bg: 'bg-cyan-100', text: 'text-cyan-800' },
};

// デフォルトの色
const DEFAULT_COLOR: CategoryColorScheme = { bg: 'bg-blue-100', text: 'text-blue-800' };

/**
 * 文字列からシンプルなハッシュ値を生成
 * @param str ハッシュ化する文字列
 * @returns 数値のハッシュ
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * カテゴリに対応する色のスキームを取得する
 * @param category カテゴリ名
 * @returns 色のスキーム（背景色とテキスト色）
 */
export function getCategoryColors(category: string): CategoryColorScheme {
  // 1. 既存のマッピングを確認
  if (CATEGORY_COLORS[category]) {
    return CATEGORY_COLORS[category];
  }
  
  // 2. 既存のマッピングがない場合、ハッシュベースで色を割り当て
  if (category && category.trim() !== '') {
    const hash = simpleHash(category);
    const colorIndex = hash % COLOR_PALETTE.length;
    return COLOR_PALETTE[colorIndex];
  }
  
  // 3. カテゴリが空文字やnullの場合はデフォルト色を返す
  return DEFAULT_COLOR;
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