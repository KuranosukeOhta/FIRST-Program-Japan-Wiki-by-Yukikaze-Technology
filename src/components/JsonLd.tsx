'use client';

import { useEffect } from 'react';

interface JsonLdProps {
  type: 'Organization' | 'WebSite' | 'Article' | 'BreadcrumbList' | 'FAQPage';
  data: Record<string, any>;
}

/**
 * JSON-LD構造化データをページに追加するコンポーネント
 * schema.orgのマークアップを実装
 */
const JsonLd: React.FC<JsonLdProps> = ({ type, data }) => {
  useEffect(() => {
    // SSRとCSRで二重にscriptが追加されないように既存のscriptを確認
    const existingScript = document.getElementById(`jsonld-${type}`);
    if (existingScript) {
      return;
    }

    // JSON-LDスクリプトを作成
    const script = document.createElement('script');
    script.id = `jsonld-${type}`;
    script.type = 'application/ld+json';
    script.innerHTML = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': type,
      ...data,
    });

    // headタグに追加
    document.head.appendChild(script);

    // コンポーネントがアンマウントされたときにスクリプトを削除
    return () => {
      const scriptToRemove = document.getElementById(`jsonld-${type}`);
      if (scriptToRemove) {
        document.head.removeChild(scriptToRemove);
      }
    };
  }, [type, data]);

  // このコンポーネントは何もレンダリングしない
  return null;
};

export default JsonLd;

// 使用例
export const OrganizationJsonLd: React.FC = () => (
  <JsonLd
    type="Organization"
    data={{
      name: 'Yukikaze Technology',
      url: 'https://first-program-japan-wiki.vercel.app',
      logo: 'https://first-program-japan-wiki.vercel.app/logo.png',
      description: 'FIRST Program Japan Wikiを運営するテクノロジー組織',
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '',
        contactType: 'customer service',
        email: 'contact@example.com',
        availableLanguage: ['Japanese', 'English'],
      },
      sameAs: [
        'https://twitter.com/YukikazeTech',
        'https://github.com/YukikazeTech',
      ],
    }}
  />
);

export const WebsiteJsonLd: React.FC = () => (
  <JsonLd
    type="WebSite"
    data={{
      name: 'FIRST Program Japan Wiki',
      url: 'https://first-program-japan-wiki.vercel.app',
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://first-program-japan-wiki.vercel.app/search?q={search_term_string}',
        'query-input': 'required name=search_term_string',
      },
    }}
  />
);

export const ArticleJsonLd: React.FC<{
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
  authorName: string;
  publishDate: string;
  modifiedDate: string;
}> = ({ title, description, url, imageUrl, authorName, publishDate, modifiedDate }) => (
  <JsonLd
    type="Article"
    data={{
      headline: title,
      description: description,
      image: imageUrl || 'https://first-program-japan-wiki.vercel.app/og-image.png',
      author: {
        '@type': 'Person',
        name: authorName,
      },
      publisher: {
        '@type': 'Organization',
        name: 'Yukikaze Technology',
        logo: {
          '@type': 'ImageObject',
          url: 'https://first-program-japan-wiki.vercel.app/logo.png',
        },
      },
      datePublished: publishDate,
      dateModified: modifiedDate,
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': url,
      },
    }}
  />
); 