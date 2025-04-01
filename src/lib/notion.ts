import { Client } from '@notionhq/client';

export const createNotionClient = () => {
  const notionApiKey = process.env.NOTION_API_KEY;
  
  if (!notionApiKey) {
    throw new Error('Notion API Key が設定されていません');
  }
  
  return new Client({ 
    auth: notionApiKey 
  });
};

// ヘルパー関数
export function extractTitle(page: any): string {
  // タイトルプロパティを抽出（Notionの仕様に合わせて調整）
  const titleProp = Object.values(page.properties).find(
    (prop: any) => prop.type === 'title'
  ) as any;
  
  if (titleProp?.title?.[0]?.plain_text) {
    return titleProp.title[0].plain_text;
  }
  
  return '無題';
}

export function extractCategory(page: any): string {
  // カテゴリープロパティを抽出（実際のプロパティ名に合わせて調整）
  const categoryProp = page.properties.Category || page.properties.カテゴリー;
  
  if (categoryProp?.select?.name) {
    return categoryProp.select.name;
  }
  
  return '';
} 