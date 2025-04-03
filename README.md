# FIRST Program Japan Wiki

FIRSTプログラム（For Inspiration and Recognition of Science and Technology）に関する情報を共有するためのウィキサイトです。Notionと連携して、最新の情報を常に反映します。

## 技術スタック

- [Next.js](https://nextjs.org/) - Reactフレームワーク
- [Supabase](https://supabase.io/) - データベースとユーザー認証
- [Notion API](https://developers.notion.com/) - コンテンツ管理
- [Tailwind CSS](https://tailwindcss.com/) - スタイリング
- [Vercel](https://vercel.com/) - ホスティングと自動デプロイ

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
   そして`.env.local`ファイルを編集して、Supabase接続情報とNotion APIキーなどを設定します。

4. 開発サーバーを起動する
   ```bash
   npm run dev
   # または
   yarn dev
   ```
   ブラウザで`http://localhost:3000`を開いて確認できます。

## データベース構造

Supabaseには以下のテーブルがあります：

- `notion_pages` - Notionのページ情報
- `notion_blocks` - ページのコンテンツブロック
- `notion_sync_status` - 同期処理のステータス

## デプロイ方法

このプロジェクトはVercelにデプロイすることを想定しています。

1. [Vercel](https://vercel.com)にアカウントを作成し、GitHubリポジトリと連携します。
2. 環境変数を設定します。
3. デプロイボタンをクリックします。

## 定期的なデータ同期

Vercelのクロンジョブ機能を使って、Notionからのデータ同期を定期的に行います。
`vercel.json`ファイルに設定されています。

## Notion同期機能について

このプロジェクトはNotionデータベースからコンテンツを取得し、Supabaseに保存する同期機能を備えています。

### 同期の仕組み

- `/api/sync-notion` エンドポイントにPOSTリクエストを送信することで同期を実行
- Vercel Cronを利用して6時間ごとに自動同期 (vercel.json に設定)
- 公開ステータスのページのみを同期する機能あり
- ページネーション機能によるバッチ処理対応

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

## ライセンス

MITライセンス

## 開発者

Yukikaze Technology 