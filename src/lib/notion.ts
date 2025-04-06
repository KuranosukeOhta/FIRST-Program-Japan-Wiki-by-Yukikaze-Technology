import { Client } from '@notionhq/client';
import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';

export function createNotionClient() {
  const apiKey = process.env.NOTION_API_KEY;
  
  if (!apiKey) {
    throw new Error('Notion API Keyが設定されていません');
  }
  
  return new Client({
    auth: apiKey,
  });
}

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
    const categoryProp = page.properties.Category || page.properties.カテゴリ || page.properties.カテゴリー;
    
    if (categoryProp?.select?.name) {
      return categoryProp.select.name;
    }
    
    return '';
  } catch (error) {
    console.error('カテゴリ抽出エラー:', error);
    return '';
  }
}

// 執筆者を抽出する関数
export function extractAuthors(page: any): string[] {
  try {
    // プロパティがない場合は空配列を返す
    if (!page.properties) {
      return [];
    }
    
    // 執筆者プロパティを抽出
    const authorProp = page.properties.Author || page.properties.Authors || 
                       page.properties.執筆者 || page.properties['執筆者(複数可)'];
    
    if (!authorProp) {
      return [];
    }
    
    // プロパティタイプに応じて処理を分岐
    if (authorProp.type === 'people' && Array.isArray(authorProp.people)) {
      return authorProp.people.map((person: any) => person.name || '').filter(Boolean);
    }
    
    if (authorProp.type === 'rich_text' && Array.isArray(authorProp.rich_text)) {
      return authorProp.rich_text.map((text: any) => text.plain_text || '').filter(Boolean);
    }
    
    if (authorProp.type === 'multi_select' && Array.isArray(authorProp.multi_select)) {
      return authorProp.multi_select.map((select: any) => select.name || '').filter(Boolean);
    }
    
    return [];
  } catch (error) {
    console.error('執筆者抽出エラー:', error);
    return [];
  }
}

// ステータスを抽出する関数
export function extractStatus(page: any): string {
  try {
    // プロパティがない場合は空文字を返す
    if (!page.properties) {
      return '';
    }
    
    // ステータスプロパティを抽出
    const statusProp = page.properties.Status || page.properties.ステータス;
    
    if (!statusProp) {
      return '';
    }
    
    // プロパティタイプに応じて処理を分岐
    if (statusProp.type === 'select' && statusProp.select) {
      return statusProp.select.name || '';
    }
    
    if (statusProp.type === 'status' && statusProp.status) {
      return statusProp.status.name || '';
    }
    
    return '';
  } catch (error) {
    console.error('ステータス抽出エラー:', error);
    return '';
  }
}

// ページが公開済みかどうかを判定する関数
export function isPublished(page: any): boolean {
  const status = extractStatus(page);
  return status === 'ページ公開済み';
}

// Notionページの元URLを生成する関数
export function getNotionPageUrl(pageId: string): string {
  if (!pageId) return '';
  
  // ページIDからハイフンを削除
  const cleanId = pageId.replace(/-/g, '');
  
  return `https://notion.so/${cleanId}`;
} 