# Next.jsでのNotion APIとSupabase連携で「fetch failed」エラーと格闘した記録

## はじめに

Next.jsアプリケーションでNotionのデータをSupabaseに同期する機能を実装しようとしたところ、ローカル開発環境で「fetch failed」というエラーに悩まされました。この記事では、その原因究明と解決に至るまでの過程を詳細に記録します。

## 問題の発生

当初、Notion APIを使ってデータベースの内容をSupabaseに同期するAPIエンドポイントを構築していました。シンプルなRoute Handlerを実装し、以下のエンドポイントを作成しました：

```typescript
// src/app/api/sync-notion/route.ts
import { NextResponse } from 'next/server';
import { createNotionClient, extractTitle, extractCategory } from '@/lib/notion';
import { createSupabaseAdmin } from '@/lib/supabase';
// ...他のインポート

export async function POST(request: Request) {
  // 認証チェック
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.SYNC_API_SECRET}`) {
    return NextResponse.json({ error: '認証エラー' }, { status: 401 });
  }
  
  try {
    // Notion APIとSupabaseクライアントを初期化
    const notion = createNotionClient();
    const supabase = createSupabaseAdmin();
    
    // Notionからデータを取得してSupabaseに保存する処理...
    // ...
  } catch (error: any) {
    console.error('同期エラー:', error);
    return NextResponse.json({
      error: 'データ同期中にエラーが発生しました',
      details: error.message
    }, { status: 500 });
  }
}
```

このエンドポイントをcurlで呼び出すと、以下のようなエラーが発生しました：

```
{"success":true,"pagesCount":0,"blocksCount":0,"errors":[{"id":"1c9a2a5c-b4ea-80d6-95d8-e0cf3040a151","error":"TypeError: fetch failed","type":"page"}, ...]}
```

## 原因の切り分け

### 最初の仮説：Notionクライアントの問題

まず最初に、`createNotionClient`関数の実装を確認しました：

```typescript
// src/lib/notion.ts
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
```

Notionクライアントがfetchを使用してAPIと通信していると推測し、`node-fetch`を使うように修正してみました：

```typescript
import { Client } from '@notionhq/client';
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
```

しかし、この修正を適用してもエラーは解消されませんでした。

### node-fetchバージョンの問題？

次に、`node-fetch`のバージョンの問題を疑いました。バージョン3系はESMのみをサポートしており、これが問題の原因かもしれないと考え、v2系に切り替えてみました：

```bash
npm uninstall node-fetch && npm install node-fetch@2
```

残念ながら、この変更でもエラーは解消されませんでした。

### 根本的な検証：単体テストスクリプト作成

Next.jsの環境外でNotionクライアントが正常に動作するか確認するために、シンプルなテストスクリプトを作成しました：

```javascript
// test-notion.js
const { Client } = require('@notionhq/client');
const fetch = require('node-fetch');
const path = require('path');
const dotenv = require('dotenv');

// .envファイルを読み込む
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

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
```

このテストスクリプトを実行したところ、APIトークンの問題が判明しました：

```
Notionクライアントを初期化しました
データベース情報を取得中...
@notionhq/client warn: request fail { code: 'unauthorized', message: 'API token is invalid.' }
エラーが発生しました:
APIResponseError: API token is invalid.
```

環境変数が正しく読み込まれていないことがわかったため、環境変数を明示的に確認する処理を追加しました：

```javascript
// 環境変数を表示
console.log('環境変数:');
console.log('NOTION_API_KEY:', process.env.NOTION_API_KEY ? '設定されています' : '設定されていません');
console.log('NOTION_DATABASE_ID:', process.env.NOTION_DATABASE_ID ? '設定されています' : '設定されていません');
```

`.env.local`ファイルから環境変数を読み込むようにし、テストスクリプトを再実行すると、今度は正常にNotionのデータベース情報を取得できました：

```
環境変数:
NOTION_API_KEY: 設定されています
NOTION_DATABASE_ID: 設定されています
Notionクライアントを初期化しました
データベース情報の取得に成功しました
データベース名: FIRST Program Japan Wiki 下書きDB
```

### axiosを使ったアプローチ

次に、`node-fetch`ではなく`axios`を使用したテストスクリプトを作成してみました：

```javascript
// test-axios-notion.js
const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

// .envファイルを読み込む
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// 環境変数を表示
console.log('環境変数:');
console.log('NOTION_API_KEY:', process.env.NOTION_API_KEY ? '設定されています' : '設定されていません');
console.log('NOTION_DATABASE_ID:', process.env.NOTION_DATABASE_ID ? '設定されています' : '設定されていません');

// 必要な環境変数のチェック...

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
    // エラーハンドリング...
  }
}

// 実行
testNotionAxios();
```

このスクリプトを実行したところ、axiosを使用したアプローチでは正常にNotionのデータにアクセスできることが確認できました：

```
環境変数:
NOTION_API_KEY: 設定されています
NOTION_DATABASE_ID: 設定されています
Axiosを使用してNotion APIにアクセス中...
データベース情報取得成功!
データベース名: FIRST Program Japan Wiki 下書きDB
ページ一覧取得成功! 41件のページが見つかりました。
最初のページ(1c9a2a5c-b4ea-80d6-95d8-e0cf3040a151)のブロックを取得中...
ブロック一覧取得成功! 23件のブロックが見つかりました。
すべてのテストが成功しました！
```

## 解決策の実装

### API Routeの修正

これらの検証結果を基に、API Routeを修正することにしました。まず、デバッグ目的で最低限の機能確認をするためのコードを実装しました：

```typescript
// src/app/api/sync-notion/route.ts
import { NextResponse } from 'next/server';
import { extractTitle, extractCategory } from '@/lib/notion';
import { createSupabaseAdmin } from '@/lib/supabase';
import { Client } from '@notionhq/client';
import nodeFetch from 'node-fetch';

export async function POST(request: Request) {
  // 認証チェック
  // ...
  
  try {
    // デバッグ情報
    console.log('環境変数:');
    console.log('NOTION_API_KEY:', process.env.NOTION_API_KEY ? '設定されています' : '設定されていません');
    console.log('NOTION_DATABASE_ID:', process.env.NOTION_DATABASE_ID ? '設定されています' : '設定されていません');
    
    // 直接Notionクライアントを初期化して試してみる
    console.log('直接Notionクライアントを初期化');
    const directNotionClient = new Client({ 
      auth: process.env.NOTION_API_KEY as string,
      fetch: nodeFetch as unknown as typeof fetch
    });
    
    try {
      console.log('データベース情報を直接取得');
      const databaseInfo = await directNotionClient.databases.retrieve({
        database_id: process.env.NOTION_DATABASE_ID as string
      });
      
      // データベース名の表示...
      
    } catch (directError: any) {
      console.error('直接クライアントでのデータベース取得エラー:', directError);
      return NextResponse.json({
        error: 'データベース情報取得中にエラーが発生しました',
        details: directError.message,
        stack: directError.stack
      }, { status: 500 });
    }
    
    // 最初のページの詳細情報を取得...
    
  } catch (error: any) {
    console.error('同期エラー:', error);
    
    return NextResponse.json({
      error: 'データ同期中にエラーが発生しました',
      details: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
```

この修正により、Next.js開発サーバーのログには次の情報が表示されました：

```
環境変数:
NOTION_API_KEY: 設定されています
NOTION_DATABASE_ID: 設定されています
直接Notionクライアントを初期化
データベース情報を直接取得
データベース情報取得成功: FIRST Program Japan Wiki 下書きDB
ページ一覧を取得中...
ページ一覧取得成功: 41件
```

さらに、最初のページの詳細を取得する処理を追加したところ、これも正常に動作しました：

```
最初のページ(1c9a2a5c-b4ea-80d6-95d8-e0cf3040a151)の詳細情報を取得中...
ページ詳細取得成功
ブロックデータ取得中: 1c9a2a5c-b4ea-80d6-95d8-e0cf3040a151
ブロック取得成功: 23件
```

### axiosを使ったAPI Routeの実装

しかし、完全な同期処理を実装しようとすると、再び「fetch failed」エラーが発生しました。これは、Supabaseクライアントがfetchを使用していることが原因と推測されます。

そこで、axiosを使って直接NotionのAPIにアクセスするアプローチを試しました：

```typescript
// src/app/api/sync-notion/route.ts
import { NextResponse } from 'next/server';
import { extractTitle, extractCategory } from '@/lib/notion';
import { createSupabaseAdmin } from '@/lib/supabase';
import axios from 'axios';

// axiosによるNotion APIアクセス関数
async function fetchDatabase(databaseId: string) {
  return axios({
    method: 'get',
    url: `https://api.notion.com/v1/databases/${databaseId}`,
    headers: {
      'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
      'Notion-Version': '2022-06-28'
    }
  });
}

async function queryDatabase(databaseId: string) {
  return axios({
    method: 'post',
    url: `https://api.notion.com/v1/databases/${databaseId}/query`,
    headers: {
      'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    }
  });
}

async function fetchBlockChildren(blockId: string) {
  return axios({
    method: 'get',
    url: `https://api.notion.com/v1/blocks/${blockId}/children`,
    headers: {
      'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
      'Notion-Version': '2022-06-28'
    }
  });
}

export async function POST(request: Request) {
  // ...認証チェック
  
  try {
    // Supabaseクライアントを初期化
    const supabase = createSupabaseAdmin();
    
    // 同期ステータスレコードを作成
    // ...
    
    // Notionデータベースからページ一覧を取得
    const databaseId = process.env.NOTION_DATABASE_ID as string;
    console.log(`Notionデータベース(${databaseId})からページ一覧を取得中...`);
    
    const pagesResponse = await queryDatabase(databaseId);
    const pages = pagesResponse.data.results;
    
    // 各ページを処理...
    // ...
    
  } catch (error: any) {
    console.error('同期エラー:', error);
    
    return NextResponse.json({
      error: 'データ同期中にエラーが発生しました',
      details: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
```

しかし、この修正を適用してもSupabaseとの接続で依然として「fetch failed」エラーが発生しました。

### ローカル実行用スクリプトの作成

最終的な解決策として、Next.jsのAPI Routeではなく、ローカルで実行するNode.jsスクリプトとして同期処理を実装することにしました：

```javascript
// sync-notion-script.js
const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// .envファイルを読み込む
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// 環境変数を正規化（Next.jsとの互換性のため）
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const NOTION_API_KEY = process.env.NOTION_API_KEY || process.env.NOTION_AUTH_TOKEN;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

// 環境変数のチェック
// ...

// axiosによるNotion APIアクセス関数
async function fetchDatabase(databaseId) {
  // ...
}

async function queryDatabase(databaseId) {
  // ...
}

async function fetchBlockChildren(blockId) {
  // ...
}

// タイトル抽出ヘルパー関数
function extractTitle(page) {
  // ...
}

// カテゴリー抽出ヘルパー関数
function extractCategory(page) {
  // ...
}

// メイン同期処理
async function syncNotionToSupabase() {
  try {
    // Supabaseクライアントを初期化
    const supabase = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY
    );
    
    // 同期ステータスレコードを作成
    // ...
    
    // Notionデータベースからページ一覧を取得
    // ...
    
    // 各ページを処理
    // ...
    
  } catch (error) {
    console.error('同期エラー:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// スクリプト実行
syncNotionToSupabase()
  .then(result => {
    if (result.success) {
      console.log('同期が成功しました！');
    } else {
      console.error('同期に失敗しました:', result.error);
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('予期せぬエラーが発生しました:', error);
    process.exit(1);
  });
```

このスクリプトを実行しても、残念ながらSupabaseへの接続時に「fetch failed」エラーが発生しました：

```
環境変数:
NOTION_API_KEY: 設定されています
NOTION_DATABASE_ID: 設定されています
SUPABASE_URL: 設定されています
SUPABASE_SERVICE_ROLE_KEY: 設定されています
同期ステータス作成エラー: {
  message: 'TypeError: fetch failed',
  details: 'TypeError: fetch failed\n' +
    '    at node:internal/deps/undici/undici:12345:11\n' +
    '    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)\n' +
    '    at async syncNotionToSupabase (/Users/ohta/github-repositories/FIRST Program Japan Wiki by Yukikaze Technology  /sync-notion-script.js:133:52)',
  hint: '',
  code: ''
}
```

## 結論と学んだこと

この一連の試行錯誤を通じて、Next.jsのローカル開発環境におけるfetch APIの互換性問題について多くのことを学びました：

1. 問題の根本原因:
   - ローカル開発環境でのNext.js API RoutesにおけるFetch API実装の問題
   - `@notionhq/client`と`@supabase/supabase-js`クライアントが内部的にfetchを使用していることによる互換性の問題

2. 解決策の考察:
   - Node.js 18以降への移行（グローバルfetch APIのサポート）
   - 本番環境（Vercel）へのデプロイ
   - スタンドアロンのNode.jsスクリプトとして実装
   - CIパイプライン（GitHub Actions等）を使った定期実行

3. 技術的知見:
   - Next.jsのAPI Routesにおける環境変数の扱い
   - Notionクライアント実装の制約
   - SupabaseクライアントとNode.jsの互換性

最終的に、本番環境（Vercel）でこの同期機能を試すことを決定しました。ローカル開発環境での問題は、より制御された本番環境では発生しない可能性があります。また、将来的には同期機能をGitHub Actionsなどのワークフローとして実装することも検討しています。

## 今後の課題

- Node.js 18以降での検証
- Vercel環境でのテスト
- 定期的な同期ジョブの設定
- フェッチ処理のエラーハンドリング改善
- バックアップと復元メカニズムの実装

この記事が、同様の問題に直面している方々の役に立てば幸いです。 