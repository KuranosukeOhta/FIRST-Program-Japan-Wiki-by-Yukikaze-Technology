const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

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

async function testNotionAxios() {
  try {
    console.log('Axiosを使用してNotion APIにアクセス中...');
    
    // Notionデータベースを取得
    const databaseResponse = await axios({
      method: 'get',
      url: `https://api.notion.com/v1/databases/${process.env.NOTION_DATABASE_ID}`,
      headers: {
        'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
        'Notion-Version': '2022-06-28'
      }
    });
    
    console.log('データベース情報取得成功!');
    console.log('データベース名:', databaseResponse.data.title?.[0]?.plain_text || 'タイトルなし');
    
    // ページ一覧を取得
    const pagesResponse = await axios({
      method: 'post',
      url: `https://api.notion.com/v1/databases/${process.env.NOTION_DATABASE_ID}/query`,
      headers: {
        'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`ページ一覧取得成功! ${pagesResponse.data.results.length}件のページが見つかりました。`);
    
    // 最初のページのブロック一覧を取得
    if (pagesResponse.data.results.length > 0) {
      const firstPageId = pagesResponse.data.results[0].id;
      console.log(`最初のページ(${firstPageId})のブロックを取得中...`);
      
      const blocksResponse = await axios({
        method: 'get',
        url: `https://api.notion.com/v1/blocks/${firstPageId}/children`,
        headers: {
          'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
          'Notion-Version': '2022-06-28'
        }
      });
      
      console.log(`ブロック一覧取得成功! ${blocksResponse.data.results.length}件のブロックが見つかりました。`);
    }
    
    console.log('すべてのテストが成功しました！');
  } catch (error) {
    console.error('エラーが発生しました:');
    if (error.response) {
      // APIからのレスポンスがあるエラー
      console.error('ステータスコード:', error.response.status);
      console.error('レスポンスヘッダー:', error.response.headers);
      console.error('レスポンスデータ:', error.response.data);
    } else if (error.request) {
      // リクエストは送信されたがレスポンスがない
      console.error('リクエストは送信されましたが、レスポンスが返ってきませんでした。');
      console.error(error.request);
    } else {
      // リクエスト作成時にエラーが発生
      console.error('リクエスト作成時にエラーが発生しました:', error.message);
    }
    console.error('設定:', error.config);
  }
}

// 実行
testNotionAxios(); 