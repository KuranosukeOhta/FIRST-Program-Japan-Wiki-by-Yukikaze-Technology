const { Client } = require('@notionhq/client');
const fetch = require('node-fetch');
const path = require('path');
const dotenv = require('dotenv');

// .envファイルを読み込む
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
// バックアップとして.envも読み込む
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// 環境変数を表示
console.log('環境変数:');
console.log('NOTION_API_KEY:', process.env.NOTION_API_KEY ? '設定されています' : '設定されていません');
console.log('NOTION_DATABASE_ID:', process.env.NOTION_DATABASE_ID ? '設定されています' : '設定されていません');

// APIキーが設定されていなければ終了
if (!process.env.NOTION_API_KEY) {
  console.error('NOTION_API_KEYが設定されていません。');
  process.exit(1);
}

// データベースIDが設定されていなければ終了
if (!process.env.NOTION_DATABASE_ID) {
  console.error('NOTION_DATABASE_IDが設定されていません。');
  process.exit(1);
}

// Notionクライアントの初期化
const notion = new Client({ 
  auth: process.env.NOTION_API_KEY,
  fetch: fetch
});

// テスト関数
async function testNotion() {
  try {
    console.log('Notionクライアントを初期化しました');
    
    // データベース情報を取得
    console.log('データベース情報を取得中...');
    const databaseId = process.env.NOTION_DATABASE_ID;
    const response = await notion.databases.retrieve({
      database_id: databaseId
    });
    
    console.log('データベース情報の取得に成功しました');
    console.log('データベース名:', response.title?.[0]?.plain_text || 'タイトルなし');
  } catch (error) {
    console.error('エラーが発生しました:');
    console.error(error);
  }
}

// 実行
testNotion(); 