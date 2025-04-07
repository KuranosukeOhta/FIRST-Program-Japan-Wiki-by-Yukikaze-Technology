# FIRST Program Japan Wiki

FIRSTプログラム（For Inspiration and Recognition of Science and Technology）に関する情報を共有するためのウィキサイトです。Notionと連携して、最新の情報を常に反映します。

## 技術スタック

- [Next.js](https://nextjs.org/) 14.2.x - Reactフレームワーク
- [Supabase](https://supabase.io/) - データベースとユーザー認証
- [Notion API](https://developers.notion.com/) - コンテンツ管理
- [Tailwind CSS](https://tailwindcss.com/) 3.4.x - スタイリング
- [Vercel](https://vercel.com/) - ホスティングと自動デプロイ
- [TypeScript](https://www.typescriptlang.org/) 5.4.x - 型安全な開発環境

## アーキテクチャ全体像

### データフロー

```
┌─────────────────┐     ┌────────────────────────────────────┐     ┌───────────────┐     ┌──────────────┐
│                 │     │             Vercel                 │     │               │     │              │
│  Notion         │     │ ┌────────────┐  ┌───────────────┐ │     │  Supabase     │     │  ブラウザ     │
│  Database       │◄────┤►│ Cron Jobs  │──│ Serverless    │◄│─────│► Database     │◄────│► (ユーザー)   │
│  (Content CMS)  │     │ └────────────┘  │ Functions     │ │     │  (Storage)    │     │              │
│                 │     │                 └───────────────┘ │     │               │     │              │
└─────────────────┘     └────────────────────────────────────┘     └───────────────┘     └──────────────┘
```

### 各コンポーネントの役割

1. **Notion Database (CMS)**
   - コンテンツ作成者がページを執筆・編集する場所
   - 直感的なインターフェースでコンテンツを構造化
   - ページ、ブロック、リレーション情報などを管理

2. **Vercel プラットフォーム**
   - **Serverless Functions**:
     - `/api/sync-notion`: NotionからSupabaseへのデータ同期処理
     - `/api/wiki/*`: Wikiデータ取得API
     - `/api/sync-status`: 同期ステータス確認用API
   - **Cron Jobs**:
     - 毎日午前0時に自動的にデータ同期を実行
     - `vercel.json`ファイルで設定
   - **Hosting**:
     - Next.jsアプリケーションのビルドとホスティング
     - 静的アセットの配信とCDN最適化
     - CI/CDパイプラインによる自動デプロイ

3. **Supabase Database**
   - NotionからのデータをSQL形式で保存
   - 高速クエリのためのインデックス最適化
   - 構造化データの効率的な保管
   - 主要テーブル:
     - `notion_pages`: ページメタデータ
     - `notion_blocks`: コンテンツブロック
     - `notion_sync_status`: 同期処理の状態管理

4. **Next.js (フロントエンド)**
   - App Routerによる効率的なルーティング
   - サーバーサイドレンダリングによるSEO最適化
   - ユーザーに対する高速なインターフェース提供
   - Supabaseからデータを取得し表示

### データ同期フロー詳細

1. Vercelのcronジョブが起動（毎日午前0時）
2. Serverless Functionの`/api/sync-notion`エンドポイントが実行
3. NotionAPIからデータベース内のページと子ブロックを取得
4. 取得したデータを加工し、SupabaseDBに保存
5. 同期状態を`notion_sync_status`テーブルに記録
6. Next.jsフロントエンドがSupabaseから最新データを取得して表示

この構成により、コンテンツ管理の柔軟性（Notion）とデータベースの効率（Supabase）、高速なフロントエンド（Next.js）、そして信頼性の高いインフラ（Vercel）を組み合わせた堅牢なアーキテクチャを実現しています。

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
├── src/                                    # ソースコードのルートディレクトリ
│   ├── app/                                # Next.js App Routerベースのページ
│   │   ├── page.tsx                        # ホームページ (15KB)
│   │   ├── layout.tsx                      # ルートレイアウト (3.1KB)
│   │   ├── globals.css                     # グローバルスタイル (6.3KB)
│   │   ├── sitemap.ts                      # サイトマップ生成 (1.9KB)
│   │   ├── about/                          # 「About」ページ
│   │   ├── contact/                        # お問い合わせページ
│   │   ├── edit/                           # 編集ページ（実装中）
│   │   ├── team/                           # チーム情報ページ
│   │   ├── wiki/                           # Wikiメインページ
│   │   │   └── [id]/                       # 動的なWikiページ (ページID別)
│   │   └── api/                            # APIエンドポイント
│   │       ├── sync-notion/                # Notion同期API
│   │       ├── sync-notion-preview/        # プレビュー用同期API
│   │       ├── sync-status/                # 同期ステータス取得API
│   │       └── wiki/                       # Wiki情報取得API
│   │
│   ├── components/                         # 再利用可能なUIコンポーネント
│   │   ├── layout/                         # レイアウト関連コンポーネント
│   │   │   ├── Footer.tsx                  # フッターコンポーネント (2.7KB)
│   │   │   └── Header.tsx                  # ヘッダーコンポーネント (1.3KB)
│   │   │
│   │   ├── notion/                         # Notion関連コンポーネント
│   │   │   └── BlockRenderer.tsx           # Notionブロックレンダリング (11KB)
│   │   │
│   │   ├── AllPages.tsx                    # 全ページ一覧表示 (13KB)
│   │   ├── ArticleSearch.tsx               # 記事検索UI (1.2KB)
│   │   ├── CategoryFilter.tsx              # カテゴリフィルター (2.4KB)
│   │   ├── CategoryPages.tsx               # カテゴリ別ページ表示 (9.1KB)
│   │   ├── ContactForm.tsx                 # お問い合わせフォーム (4.9KB)
│   │   ├── HomeButtons.tsx                 # ホームページのボタン (811B)
│   │   ├── HomePage.tsx                    # ホームページコンポーネント (8.4KB)
│   │   ├── JsonLd.tsx                      # JSON-LD構造化データ (3.3KB)
│   │   ├── Layout.tsx                      # 汎用レイアウト (14KB)
│   │   ├── Loading.tsx                     # ロード表示 (2.1KB)
│   │   ├── Navigation.tsx                  # ナビゲーションメニュー (3.4KB)
│   │   ├── NotionContent.tsx               # Notionコンテンツ表示 (26KB)
│   │   ├── NotionList.tsx                  # Notionページリスト (5.4KB)
│   │   ├── NotionPageDetail.tsx            # Notionページ詳細表示 (4.9KB)
│   │   ├── PageDetail.tsx                  # ページ詳細コンポーネント (33KB)
│   │   ├── RelatedArticlesSection.tsx      # 関連記事セクション (3.6KB)
│   │   ├── RelatedPages.tsx                # 関連ページリスト (849B)
│   │   ├── SearchResults.tsx               # 検索結果表示 (10KB)
│   │   ├── SortMenu.tsx                    # ソートメニュー (2.6KB)
│   │   └── TableOfContents.tsx             # 目次コンポーネント (1.3KB)
│   │
│   ├── lib/                                # ユーティリティ関数・APIクライアント
│   │   ├── data.ts                         # データ取得関数 (16KB)
│   │   ├── notion.ts                       # Notion APIラッパー (3.9KB)
│   │   └── supabase.ts                     # Supabaseクライアント (1.8KB)
│   │
│   └── utils/                              # 汎用ユーティリティ
│       ├── api.ts                          # API呼び出し関数 (4.2KB)
│       ├── categoryColors.ts               # カテゴリカラー設定 (3.5KB)
│       └── metadata.ts                     # メタデータユーティリティ (2.7KB)
│
├── public/                                 # 静的ファイル
│   ├── robots.txt                          # クローラー設定
│   ├── favicon.ico                         # ファビコン
│   ├── apple-touch-icon.png                # Appleデバイス用アイコン
│   ├── og-image.png                        # OGP画像
│   ├── globe.svg                           # グローブアイコン
│   ├── window.svg                          # ウィンドウアイコン
│   ├── file.svg                            # ファイルアイコン
│   ├── next.svg                            # Next.jsロゴ
│   ├── vercel.svg                          # Vercelロゴ
│   └── debug/                              # デバッグ用リソース
│
├── supabase/                               # Supabase関連設定
│   └── functions/                          # Supabase Edge Functions
│       └── notion/                         # Notion関連機能
│
├── debug_data/                             # デバッグデータ
├── backup/                                 # バックアップファイル
├── backup-api/                             # APIバックアップ
├── docs/                                   # プロジェクトドキュメント
│
├── package.json                            # パッケージ設定 (1.0KB)
├── tsconfig.json                           # TypeScript設定 (712B)
├── tailwind.config.js                      # Tailwind CSS設定 (574B)
├── postcss.config.js                       # PostCSS設定 (83B)
├── next.config.js                          # Next.js設定 (138B)
├── vercel.json                             # Vercel設定 (298B)
└── README.md                               # プロジェクト説明 (3.5KB)
```

## データベース構造

Supabaseには以下のテーブルがあります：

- `notion_pages` - Notionのページ情報
- `notion_blocks` - ページのコンテンツブロック

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


## ライセンス

MITライセンス

## 開発者

Yukikaze Technology 