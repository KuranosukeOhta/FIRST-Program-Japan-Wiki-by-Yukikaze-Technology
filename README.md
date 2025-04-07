# FIRST Program Japan Wiki

FIRSTプログラム（For Inspiration and Recognition of Science and Technology）に関する情報を共有するためのウィキサイトです。Notionと連携して、最新の情報を常に反映します。

## 技術スタック

- [Next.js](https://nextjs.org/) 14.2.x - Reactフレームワーク
- [Supabase](https://supabase.io/) - データベースとユーザー認証
- [Notion API](https://developers.notion.com/) - コンテンツ管理
- [Tailwind CSS](https://tailwindcss.com/) 3.4.x - スタイリング
- [Vercel](https://vercel.com/) - ホスティングと自動デプロイ
- [TypeScript](https://www.typescriptlang.org/) 5.4.x - 型安全な開発環境

## 開発環境のセットアップ

### 前提条件

- Node.js 18.x以上
- npm または yarn
- Supabaseアカウント
- NotionのAPIキーとデータベースID

### インストール手順

1. リポジトリをクローンする
   ```bash
   git clone https://github.com/yourusername/first-program-japan-wiki.git
   cd first-program-japan-wiki
   ```

2. 依存パッケージをインストールする
   ```bash
   npm install
   # または
   yarn install
   ```

3. 環境変数を設定する
   `.env.example`を`.env.local`にコピーして、必要な環境変数を設定します。
   ```bash
   cp .env.example .env.local
   ```
   そして`.env.local`ファイルを編集して、以下の環境変数を設定します：

   ```
   # Supabase接続設定
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   
   # ベースURL設定
   NEXT_PUBLIC_BASE_URL=http://localhost:3000 (開発時)
   
   # Notion同期設定
   NOTION_AUTH_TOKEN=your_notion_auth_token
   NOTION_DATABASE_ID=your_notion_database_id
   
   # Notion同期用環境変数
   NOTION_API_KEY=your_notion_api_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   SYNC_API_SECRET=your_sync_api_secret
   ```

4. 開発サーバーを起動する
   ```bash
   npm run dev
   # または
   yarn dev
   ```
   ブラウザで`http://localhost:3000`を開いて確認できます。

## プロジェクト構成

```
/
├── src/                  # ソースコード
│   ├── app/              # Next.js App Router
│   ├── components/       # 再利用可能なコンポーネント
│   ├── lib/              # ユーティリティ関数・APIクライアント
│   └── utils/            # 汎用ユーティリティ
├── public/               # 静的ファイル
└── supabase/             # Supabase関連設定
```

## データベース構造

Supabaseには以下のテーブルがあります：

- `notion_pages` - Notionのページ情報
- `notion_blocks` - ページのコンテンツブロック
- `notion_sync_status` - 同期処理のステータス

## デプロイ方法

このプロジェクトはVercelにデプロイされています。

1. [Vercel](https://vercel.com)にアカウントを作成し、GitHubリポジトリと連携します。
2. 環境変数を設定します。
3. デプロイボタンをクリックします。

現在のサイトURL: https://first-program-japan-wiki.vercel.app

## 定期的なデータ同期

Vercelのクロンジョブ機能を使って、Notionからのデータ同期を毎日1回（午前0時）行っています。設定は`vercel.json`ファイルに記述されています。

```json
{
  "crons": [
    {
      "path": "/api/sync-notion",
      "schedule": "0 0 * * *"
    }
  ]
}
```

## Notion同期機能について

このプロジェクトはNotionデータベースからコンテンツを取得し、Supabaseに保存する同期機能を備えています。

### 同期の仕組み

- `/api/sync-notion` エンドポイントにPOSTリクエストを送信することで同期を実行
- Vercel Cronを利用して毎日午前0時に自動同期
- 公開ステータスのページのみを同期する機能あり
- ページネーション機能によるバッチ処理対応
- 関連ページの自動リンク生成機能

### 必要な環境変数

```
NOTION_API_KEY=your_notion_api_key
NOTION_DATABASE_ID=your_notion_database_id
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SYNC_API_SECRET=your_sync_api_secret_key
```

### 開発環境での注意点

- Node.js 18以上を使用してください (fetch APIのネイティブサポートのため)
- 開発環境では `fetch failed` エラーが発生する場合がありますが、Vercel環境では正常に動作します
- 大量のデータ同期はタイムアウトの可能性があるため、ページネーションパラメータを使用してください
- Vercel環境の同期処理は最大60秒のタイムアウト設定があります（vercel.jsonに設定）

## 機能と更新履歴

- 執筆日・更新日を日本時間（Asia/Tokyo）で表示
- カテゴリー別のページ一覧表示
- 検索機能
- 関連ページの自動表示
- モバイル対応レスポンシブデザイン

## ライセンス

MITライセンス

## 開発者

Yukikaze Technology 