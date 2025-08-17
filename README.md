# Blog AWS Practice Stack

AWS ECS Fargate + Cloudflare Workers 構成のフルスタックアプリケーション

## プロジェクト概要

AWS学習を目的としたプロジェクト。Cloudflare Workers上で動作していたアプリケーションをAWS ECS Fargateに移行。

### 構成

- **バックエンド**: AWS ECS Fargate
- **フロントエンド**: Cloudflare Workers Static Assets
- **プロキシ**: Cloudflare Workers
- **CI/CD**: GitHub Actions
- **アーキテクチャ**: クリーンアーキテクチャ

## システムアーキテクチャ

```
クライアントブラウザ
    │
    ├─── React SPA (Cloudflare Workers Static Assets)
    │     ・Apollo Client
    │     ・Supabase Auth Client
    │     ・React Router
    │     ・Catalyst UI Kit
    │
    │ HTTPS GraphQLリクエスト (JWT付き)
    ▼
Cloudflare Workers Proxy
    │ ・HTTPS→HTTP変換
    │ ・CORSヘッダー付与
    │
    │ HTTP転送
    ▼
Application Load Balancer (ALB)
    │ ・パブリックエンドポイント
    │ ・ヘルスチェック (/health)
    │
    │ プライベートサブネット内転送
    ▼
ECS Fargate Service
    │ ・0.25 vCPU, 0.5GB RAM
    ├─── Apollo Server (Express.js)
    │     ・GraphQLリゾルバー
    │     ・Supabase JWT検証
    │     ・Prisma ORM
    │
    │ VPC内通信
    ▼
RDS PostgreSQL
    ・db.t4g.micro
    ・PostgreSQL 17.4

外部サービス:
    ├── Supabase Auth
    ├── AWS Secrets Manager
    ├── Amazon ECR
    └── Cloudflare CDN
```

## 技術スタック

### バックエンド (AWS ECS Fargate)

- Node.js 22 LTS
- Express.js 4.21
- Apollo Server 5.0
- Prisma 6.3
- PostgreSQL 17.4

### フロントエンド (Cloudflare Workers)

- React 18
- Vite 6
- Tailwind CSS v4
- Apollo Client
- React Router v7

### インフラ

- Docker
- ECS Fargate
- RDS PostgreSQL (db.t4g.micro)
- Application Load Balancer
- VPC (10.0.0.0/16)
- NAT Gateway
- AWS Secrets Manager
- Amazon ECR

### 開発ツール

- Turborepo
- pnpm v8.14.0
- GraphQL Code Generator
- TypeScript 5.7
- ESLint
- Prettier

## セットアップ

### 前提条件

- Node.js v22.11.0
- pnpm v8.14.0
- Docker Desktop
- AWS CLI
- Cloudflareアカウント
- Supabaseアカウント

### 初期設定

1. **リポジトリのクローン**

   ```bash
   git clone https://github.com/yuuyu00/blog-aws-practice.git
   cd blog-aws-practice
   ```

2. **依存関係のインストール**

   ```bash
   pnpm install
   ```

3. **環境変数の設定**

   `packages/server/.env`:
   ```env
   DATABASE_URL="postgresql://bloguser:blogpassword@localhost:5432/blogdb"
   SUPABASE_URL=your-supabase-url
   SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_JWT_SECRET=your-supabase-jwt-secret
   CORS_ORIGIN=http://localhost:3000
   NODE_ENV=development
   PORT=4000
   ```

4. **ローカルデータベースの起動**

   ```bash
   docker-compose up -d
   ```

5. **データベースマイグレーション**

   ```bash
   cd packages/server
   pnpm prisma migrate dev
   pnpm prisma db seed
   ```

6. **コード生成**

   ```bash
   pnpm generate
   ```

## 開発

### 開発サーバーの起動

```bash
# 全サービス起動
pnpm dev

# 個別起動
cd packages/server && pnpm dev     # http://localhost:4000
cd packages/frontend && pnpm dev   # http://localhost:3000
```

### GraphQL Playground

開発環境: http://localhost:4000/graphql (Apollo Sandbox)

### 開発コマンド

```bash
# GraphQLスキーマ変更後
pnpm generate

# DBスキーマ変更
cd packages/server
pnpm prisma migrate dev --name migration_name

# 型チェック
pnpm type-check

# リント
pnpm lint

# フォーマット
pnpm format

# ビルド
pnpm build

# Prisma Studio
cd packages/server
pnpm prisma-studio  # http://localhost:5555
```

## デプロイ

### 自動デプロイ

`develop`ブランチへのプッシュで自動デプロイ：

- Backend → AWS ECS Fargate
- Frontend → Cloudflare Workers
- Proxy → Cloudflare Workers

### 手動デプロイ

```bash
# Backend (AWS ECS)
./scripts/deploy-to-ecr.sh

# Frontend (Cloudflare Workers)
cd packages/frontend
pnpm deploy:prod

# Proxy (Cloudflare Workers)
cd packages/proxy
pnpm deploy:prod
```

## 運用

### RDS接続

```bash
# 踏み台サーバーのデプロイ
./scripts/deploy-bastion.sh

# RDS接続
./scripts/connect-bastion.sh
```

### ログ確認

```bash
# ECSタスクログ
aws logs tail /ecs/blog-aws-practice --follow
```

## コスト

月額コスト（東京リージョン、24時間稼働）：

| サービス | 仕様 | 月額（USD） |
|---------|------|------------|
| ECS Fargate | 0.25 vCPU, 0.5GB RAM | ~$11 |
| ALB | 基本料金 + データ転送 | ~$20 |
| RDS PostgreSQL | db.t4g.micro (Free tier) | $0 |
| NAT Gateway | 1個 | ~$33 |
| Secrets Manager | 1シークレット | ~$0.40 |
| ECR | <1GB | ~$0.10 |
| **合計** | | **約$64.50** |

## エンドポイント

- **ALB DNS**: `blog-aws-practice-alb-169089192.ap-northeast-1.elb.amazonaws.com`
- **Frontend (Production)**: `https://blog-aws-practice-frontend.mrcdsamg63.workers.dev`
- **Proxy (Production)**: `https://blog-aws-practice-proxy-prod.mrcdsamg63.workers.dev`
- **ECR URI**: `664660631613.dkr.ecr.ap-northeast-1.amazonaws.com/blog-aws-practice-server`

## ドキュメント

- [CLAUDE.md](./CLAUDE.md) - プロジェクト詳細仕様
- [AWS_MIGRATION_PLAN.md](./AWS_MIGRATION_PLAN.md) - AWS移行計画
- [AWS_MIGRATION_PROGRESS.md](./AWS_MIGRATION_PROGRESS.md) - 移行進捗
- [AWS_MANUAL_SETUP_GUIDE.md](./AWS_MANUAL_SETUP_GUIDE.md) - AWS構築手順
- [GITHUB_SECRETS_SETUP.md](./docs/GITHUB_SECRETS_SETUP.md) - CI/CD設定

## ライセンス

MIT License