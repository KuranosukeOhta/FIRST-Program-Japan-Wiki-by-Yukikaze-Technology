import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 固定ページのURL
  const staticRoutes = [
    {
      url: 'https://first-program-japan-wiki.vercel.app',
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
    {
      url: 'https://first-program-japan-wiki.vercel.app/about',
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: 'https://first-program-japan-wiki.vercel.app/contact',
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: 'https://first-program-japan-wiki.vercel.app/wiki',
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: 'https://first-program-japan-wiki.vercel.app/team',
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
  ];

  // 実装注意点: 本番環境では、以下のようにデータベースからページ情報を取得して
  // 動的にサイトマップを生成するようにします
  /*
  // 動的に生成されるWikiページのURL
  let wikiPages = [];
  try {
    // Supabaseまたは他のDBからすべてのWikiページのIDとタイトル、更新日時を取得
    const pages = await fetchAllWikiPages();
    
    wikiPages = pages.map(page => ({
      url: `https://first-program-japan-wiki.vercel.app/wiki/${page.id}`,
      lastModified: new Date(page.last_edited_time),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
  } catch (error) {
    console.error('サイトマップ生成エラー:', error);
  }
  
  return [...staticRoutes, ...wikiPages];
  */
  
  // 開発環境では固定ページのみ返す
  return staticRoutes;
} 