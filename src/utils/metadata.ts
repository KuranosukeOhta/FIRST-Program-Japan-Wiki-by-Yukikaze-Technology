import type { Metadata } from 'next';

interface GenerateMetadataOptions {
  title?: string;
  description?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  pathName?: string;
  noIndex?: boolean;
  keywords?: string[];
  author?: string;
}

/**
 * ページごとのメタデータを生成するユーティリティ関数
 */
export function generateMetadata({
  title,
  description,
  ogImage = '/og-image.png',
  ogType = 'website',
  pathName = '',
  noIndex = false,
  keywords = [],
  author = 'Yukikaze Technology',
}: GenerateMetadataOptions): Metadata {
  // デフォルトのタイトルと説明
  const defaultTitle = 'FIRST Program Japan Wiki';
  const defaultDescription = 'FIRSTプログラムに関する情報共有のためのウィキサイトです。FRC、FTC、FLLなどの競技情報やチームビルディング、プログラミング、メカニカル設計などの技術的なリソースを提供しています。';
  
  // ページタイトルの作成（個別ページ名 | サイト名）
  const fullTitle = title ? `${title} | ${defaultTitle}` : defaultTitle;
  
  // ページの説明（指定がなければデフォルトを使用）
  const fullDescription = description || defaultDescription;
  
  // カノニカルURLの作成
  const canonicalUrl = `https://first-program-japan-wiki.vercel.app${pathName}`;

  // デフォルトのキーワード
  const defaultKeywords = [
    'FIRST', 'ロボティクス', 'FRC', 'FTC', 'FLL', 'STEM教育', 
    '競技ロボット', '技術学習', '日本', 'FIRST JAPAN'
  ];
  
  // キーワードのマージ（重複を除去）
  const mergedKeywords = [...new Set([...defaultKeywords, ...keywords])];

  return {
    title: fullTitle,
    description: fullDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    keywords: mergedKeywords,
    authors: [{ name: author }],
    creator: author,
    openGraph: {
      title: fullTitle,
      description: fullDescription,
      type: ogType,
      url: canonicalUrl,
      siteName: 'FIRST Program Japan Wiki',
      locale: 'ja_JP',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: fullTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: fullDescription,
      images: [ogImage],
      creator: '@YukikazeTech',
      site: '@YukikazeTech',
    },
    robots: noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-image-preview': 'large',
            'max-snippet': -1,
          },
        },
  };
} 