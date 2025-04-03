import { Client } from '@notionhq/client';
import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import nodeFetch from 'node-fetch';

export const createNotionClient = () => {
  const notionApiKey = process.env.NOTION_API_KEY;
  
  if (!notionApiKey) {
    throw new Error('Notion API Key が設定されていません');
  }
  
  return new Client({ 
    auth: notionApiKey,
    fetch: nodeFetch as unknown as typeof fetch
  });
};

// ヘルパー関数
export function extractTitle(page: any): string {
  try {
    // タイトルプロパティを抽出（Notionの仕様に合わせて調整）
    if (!page.properties) {
      return '無題';
    }
    
    const titleProp = Object.values(page.properties).find(
      (prop: any) => prop.type === 'title'
    ) as any;
    
    if (titleProp?.title?.[0]?.plain_text) {
      return titleProp.title[0].plain_text;
    }
    
    return '無題';
  } catch (error) {
    console.error('タイトル抽出エラー:', error);
    return '無題';
  }
}

export function extractCategory(page: any): string {
  try {
    // プロパティがない場合は空文字を返す
    if (!page.properties) {
      return '';
    }
    
    // カテゴリープロパティを抽出（実際のプロパティ名に合わせて調整）
    const categoryProp = page.properties.Category || page.properties.カテゴリー;
    
    if (categoryProp?.select?.name) {
      return categoryProp.select.name;
    }
    
    return '';
  } catch (error) {
    console.error('カテゴリ抽出エラー:', error);
    return '';
  }
} 