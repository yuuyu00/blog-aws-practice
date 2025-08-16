# Blog AWS Practice Stack

Cloudflare Workers上で動作するApollo Server、React、Supabase Authを統合したフルスタックアプリケーション

## 概要

このプロジェクトは以下の技術を使用した本番環境対応のアーキテクチャを実装しています。

- **バックエンド**: Cloudflare Workers上で動作するApollo GraphQL ServerとD1データベース
- **フロントエンド**: Cloudflare Workers Static Assetsとしてデプロイされた React SPA
- **認証**: JWT検証によるSupabase Auth
- **インフラ**: Cloudflareのエッジネットワーク上で完全サーバーレス

## アーキテクチャ

```
クライアントブラウザ
    │
    ├─── React SPA (Cloudflare Workers Static Assets)
    │     ・Apollo Client (GraphQL)
    │     ・Supabase Auth Client
    │     ・React Router (SPAルーティング)
    │
    │ GraphQLリクエスト (JWT付きヘッダー)
    ▼
Apollo Server (Cloudflare Workers)
    │
    ├─── GraphQLスキーマ & リゾルバー
    ├─── Supabase JWT検証
    └─── Prisma ORM (D1 Adapter)
    │
    │ SQLクエリ
    ▼
Cloudflare D1 (SQLite)
    ・ユーザーデータ
    ・記事コンテンツ
    ・カテゴリ管理

外部サービス:
    Supabase Auth
    ・ユーザー登録/ログイン
    ・JWTトークン生成
    ・OAuthプロバイダーサポート
```

## 技術スタック

### バックエンド

- **ランタイム**: Cloudflare Workers (エッジコンピューティング)
- **API**: Apollo ServerによるGraphQL
- **データベース**: Cloudflare D1 (エッジで動作するSQLite)
- **ORM**: Prisma (D1 Adapter使用)
- **認証**: Supabase JWT検証

### フロントエンド

- **フレームワーク**: React 18 (TypeScript)
- **ビルドツール**: Vite
- **スタイリング**: Tailwind CSS
- **GraphQLクライアント**: Apollo Client
- **ルーティング**: React Router
- **デプロイ**: Cloudflare Workers Static Assets

### 開発ツール

- **モノレポ管理**: Turborepo + pnpm workspaces
- **パッケージマネージャー**: pnpm
- **コード生成**: GraphQL Code Generator
- **型安全性**: エンドツーエンドのTypeScript
- **CI/CD**: GitHub Actions

## プロジェクト構成

```
blog-aws-practice/
├── packages/
│   ├── server/                  # Cloudflare Workers上のApollo Server
│   │   ├── src/
│   │   │   ├── index.ts        # Workersエントリーポイント
│   │   │   ├── resolvers/      # GraphQLリゾルバー
│   │   │   ├── db.ts          # Prismaクライアント設定
│   │   │   └── auth.ts        # JWT検証
│   │   ├── schema/            # GraphQLスキーマファイル (.gql)
│   │   ├── prisma/            # データベーススキーマ
│   │   ├── migrations/        # D1マイグレーション
│   │   └── wrangler.toml      # Cloudflare Workers設定
│   │
│   └── frontend/              # React SPA
│       ├── src/
│       │   ├── components/    # Reactコンポーネント
│       │   ├── screens/       # ページコンポーネント
│       │   ├── graphql/       # GraphQLクエリ/ミューテーション
│       │   └── generated-graphql/ # 自動生成された型
│       ├── wrangler.toml      # Static Assets設定
│       └── .env.development   # 開発環境設定
│
├── .github/
│   └── workflows/
│       └── deploy.yml         # CI/CDパイプライン
├── turbo.json                 # Turborepo設定
├── pnpm-workspace.yaml        # pnpmワークスペース設定
└── README.md                  # このファイル
```

## セットアップ

### 前提条件

- Node.js v22.11.0 (LTS)
- pnpm v9以上
- Cloudflareアカウント
- Supabaseアカウント

### 初期設定

1. **リポジトリのクローン**

   ```bash
   git clone <repository-url>
   cd blog-aws-practice
   ```

2. **依存関係のインストール**

   ```bash
   pnpm install
   ```

3. **環境変数の設定**

   バックエンド (`packages/server/.dev.vars`):

   ```
   SUPABASE_URL=your-supabase-url
   SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_JWT_SECRET=your-supabase-jwt-secret
   GRAPHQL_INTROSPECTION=true
   CORS_ORIGIN=http://localhost:3000
   ```

   バックエンド (`packages/server/.env`):

   ```
   DATABASE_URL="file:./dev.db"
   ```

   フロントエンドの環境ファイルはリポジトリに含まれています。

4. **Cloudflare D1データベースの作成**

   ```bash
   cd packages/server
   pnpm wrangler d1 create blog-aws-practice-db
   ```

   作成されたIDで`wrangler.toml`の`database_id`を更新してください。

5. **データベースマイグレーションの適用**

   ```bash
   # ローカル環境
   pnpm d1:migrations:apply

   # リモート環境
   pnpm d1:migrations:apply:remote
   ```

6. **コード生成**
   ```bash
   # プロジェクトルートから
   pnpm generate
   ```

## 開発

### 開発サーバーの起動

```bash
# バックエンドとフロントエンドの両方を起動
pnpm dev

# バックエンドのみ (http://localhost:8787)
cd packages/server && pnpm dev

# フロントエンドのみ (http://localhost:3000)
cd packages/frontend && pnpm dev
```

### 開発ワークフロー

1. **GraphQLスキーマの変更**

   - `packages/server/schema/`内の`.gql`ファイルを編集
   - `pnpm generate`を実行して型を更新
   - `packages/server/src/resolvers/`でリゾルバーを実装

2. **データベーススキーマの変更**

   - `packages/server/prisma/schema.prisma`を更新
   - マイグレーション作成: `pnpm d1:migrations:create <name>`
   - ローカルに適用: `pnpm d1:migrations:apply`
   - Prismaクライアント生成: `pnpm prisma generate`

3. **フロントエンド開発**
   - `packages/frontend/src/graphql/`でGraphQLクエリを記述
   - `pnpm generate`を実行して型付きフックを作成
   - Reactコンポーネントで生成されたフックを使用

### コード品質チェック

```bash
# 型チェック
pnpm type-check

# リンティング
pnpm lint

# コードフォーマット
pnpm format

# ビルド（全チェックを含む）
pnpm build
```

## デプロイ

### 手動デプロイ

```bash
# バックエンドのデプロイ
cd packages/server
pnpm deploy:dev    # 開発環境
pnpm deploy:prod   # 本番環境

# フロントエンドのデプロイ
cd packages/frontend
pnpm deploy:dev    # 開発環境
pnpm deploy:prod   # 本番環境
```

### 自動デプロイ (GitHub Actions)

GitHub Actionsによる自動デプロイが設定されています。

- `develop`ブランチへのプッシュ: 開発環境へデプロイ
- `main`ブランチへのプッシュ: 本番環境へデプロイ

必要なGitHub Secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

## 主な特徴

### ゼロコストの静的ホスティング

フロントエンドの静的アセットはWorkerの起動なしにCloudflareのエッジネットワークから直接配信されるため、ホスティングコストが発生しません。

### エッジコンピューティング

APIとデータベースの両方がCloudflareのエッジロケーションで実行され、世界中のユーザーに対して低遅延を実現します。

### 完全な型安全性

PrismaとGraphQL Code Generatorにより、データベーススキーマからReactコンポーネントまでエンドツーエンドの型安全性を提供します。

### 効率的な開発環境

- ホットリロードによる即時反映
- 自動コード生成による開発効率化
- Turborepoによる効率的なモノレポ管理
- 統合されたリンティングと型チェック

## パフォーマンス

- **グローバルCDN**: 300以上のエッジロケーションで静的アセットをキャッシュ
- **エッジコンピューティング**: APIがユーザーの近くで実行
- **最適化されたバンドル**: コード分割と遅延読み込み
- **コールドスタートの最小化**: Workersの高速起動

## スケーラビリティ

- **サーバーレスアーキテクチャ**: 自動スケーリングによりトラフィックの増減に対応
- **エッジデータベース**: D1による一貫したパフォーマンス
- **静的アセット配信**: フロントエンドの無制限スケーリング
- **従量課金モデル**: 使用量に応じた柔軟なコスト構造

## トラブルシューティング

一般的な問題と解決方法については[CLAUDE.md](./CLAUDE.md#トラブルシューティング)を参照してください。
# blog-aws-practice
