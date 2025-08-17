# AWS ECS Fargate移行計画書

## 概要

このドキュメントは、現在Cloudflare Workers上で稼働しているApollo GraphQL ServerをAWS ECS Fargateに移行するための詳細な計画書です。本プロジェクトの主目的は、AWS初心者がAWSインフラ構築を1から実践することで、AWSの深い理解を得ることです。フロントエンドは引き続きCloudflare Workersにデプロイし、バックエンドのみAWSに移行します。

## 移行後のアーキテクチャ

```
クライアントブラウザ
    │
    ├─── React SPA (Cloudflare Workers Static Assets)
    │     ・Apollo Client (GraphQL)
    │     ・Supabase Auth Client
    │     ・React Router (SPAルーティング)
    │     ・デプロイ先: Cloudflare Workers（無料の静的配信）
    │
    │ GraphQLリクエスト (JWT付きヘッダー)
    │ HTTPS経由でALBのドメインにアクセス
    ▼
Application Load Balancer (ALB)
    │ ・パブリックエンドポイント
    │ ・HTTPS終端
    │ ・ヘルスチェック
    │
    │ ターゲットグループへ転送
    ▼
ECS Fargate Service
    │ ・プライベートサブネット内で実行
    ├─── Apollo Server (Node.js Container)
    │     ・Express.js上で動作
    │     ・GraphQLスキーマ & リゾルバー
    │     ・Supabase JWT検証
    │     ・Prisma ORM
    │
    │ VPC内プライベート通信
    ▼
Aurora RDS PostgreSQL
    ・シングルAZ構成（開発環境）
    ・db.t4g.small（最小インスタンス）
    ・自動バックアップ
    ・暗号化対応

外部サービス:
    ├── Supabase Auth (※変更なし)
    │    ・ユーザー登録/ログイン
    │    ・JWTトークン生成
    │    ・OAuthプロバイダーサポート
    │
    ├── AWS Secrets Manager
    │    ・データベース認証情報
    │    ・Supabase API Keys
    │    ・その他の機密情報
    │
    ├── Amazon ECR
    │    ・Dockerイメージの保存
    │    ・バージョン管理
    │
    └── Cloudflare
         ・Frontend静的アセットの配信
         ・グローバルCDN
         ・DDoS保護
```

## プロジェクト名の変更

現在のプロジェクト名を以下のように変更します：

| 項目 | 変更前 | 変更後 |
|------|--------|--------|
| ルートパッケージ名 | apollo-cloudflare-react | blog-aws-practice |
| Backendパッケージ名 | @apollo-cloudflare-react/backend | @blog-aws-practice/server |
| Frontendパッケージ名 | @apollo-cloudflare-react/frontend | @blog-aws-practice/frontend |
| Backend Worker名 | apollo-cloudflare-api | blog-aws-practice-api |
| Frontend Worker名 | apollo-cloudflare-frontend | blog-aws-practice-frontend |
| D1データベース名 | apollo-cloudflare-db | - (Aurora RDSを使用) |

## 移行作業フェーズ

### フェーズ1: プロジェクト名変更とローカル環境整備

1. **プロジェクト全体の命名変更**
   - package.jsonファイルの更新
   - wrangler.tomlの更新
   - 環境変数ファイルの更新
   - ドキュメントの更新

2. **ローカル開発環境の構築**
   - Docker Composeの作成（PostgreSQL）
   - Prismaスキーマの更新（SQLite → PostgreSQL）
   - マイグレーションファイルの再作成
   - 環境変数の整理

3. **Backend（server）の改修**
   - Express.jsサーバーとしての実装
   - ヘルスチェックエンドポイントの追加
   - 環境変数の読み込み方法の変更
   - Dockerfileの作成

### フェーズ2: AWSインフラ構築（手動）

1. **ネットワーク構築**
   - VPCの作成（10.0.0.0/16）
   - パブリックサブネット × 2（ALB用、10.0.1.0/24、10.0.2.0/24）
   - プライベートサブネット × 2（ECS/RDS用、10.0.11.0/24、10.0.12.0/24）
   - インターネットゲートウェイ
   - NAT Gateway × 1（開発環境のため1つで十分）
   - ルートテーブルの設定

2. **セキュリティ設定**
   - セキュリティグループの作成
     - ALB用（HTTP/HTTPS）
     - ECS用（ALBからのみ）
     - RDS用（ECSからのみ）

3. **データベース構築**
   - Aurora PostgreSQL クラスターの作成
   - シングルAZ構成（開発環境）
   - db.t4g.small インスタンス
   - 自動バックアップ設定（7日間保持）
   - デフォルトパラメーターグループを使用

4. **Secrets Manager設定**
   - データベース認証情報
   - Supabase関連の環境変数
   - その他のシークレット

5. **ECRリポジトリ作成**
   - blog-aws-practice-server リポジトリ

6. **ALBの設定**
   - ターゲットグループの作成
   - リスナーの設定（HTTP → HTTPS リダイレクト）
   - ヘルスチェックの設定

7. **ECSクラスターとサービス**
   - Fargateクラスターの作成
   - タスク定義の作成
   - サービスの作成（Auto Scaling設定含む）

### フェーズ3: CI/CD構築

1. **GitHub Actions ワークフロー作成**
   - Dockerイメージのビルド
   - ECRへのプッシュ
   - ECSサービスの更新
   - Blue/Greenデプロイメント

2. **GitHub Secretsの設定**
   - AWS認証情報
   - ECRリポジトリURI
   - その他必要な環境変数

### フェーズ4: Frontend更新とテスト

1. **Frontend環境変数の更新**
   - GraphQLエンドポイントをALBのURLに変更
   - CORS設定の確認

2. **統合テスト**
   - エンドツーエンドの動作確認
   - パフォーマンステスト
   - セキュリティテスト

### フェーズ5: Frontend Cloudflare Workersデプロイ

1. **環境変数ファイルの設定**
   - `.env.development`の更新（開発用ALBエンドポイント）
   - `.env.production`の更新（本番用ALBエンドポイント）
   - ALBのURLをGraphQLエンドポイントとして設定

2. **CORS設定の確認**
   - ServerのCORS設定でCloudflare WorkersのURLを許可
   - 開発・本番それぞれのWorker URLを追加

3. **Cloudflareへのデプロイ**
   - `pnpm deploy:dev`で開発環境にデプロイ
   - 動作確認後、`pnpm deploy:prod`で本番環境にデプロイ

4. **最終確認**
   - Cloudflare Workers → AWS ALB → ECS の通信確認
   - 認証フローの動作確認
   - エラーハンドリングの確認

## 必要なAWSリソース一覧

### ネットワーク
- VPC × 1
- パブリックサブネット × 2（マルチAZ対応）
- プライベートサブネット × 2（マルチAZ対応）
- インターネットゲートウェイ × 1
- NAT Gateway × 1（開発環境用）
- Elastic IP × 1（NAT Gateway用）
- ルートテーブル × 3

### コンピューティング
- ECS Fargateクラスター × 1
- ECS Service × 1
- ECS Task Definition
- Application Load Balancer × 1
- Target Group × 1

### データベース
- Aurora PostgreSQL クラスター × 1
- DBインスタンス × 1（db.t4g.small、シングルAZ）

### ストレージ
- ECR リポジトリ × 1

### セキュリティ
- Security Group × 3（ALB、ECS、RDS用）
- IAM Role × 2（ECS Task用、GitHub Actions用）
- Secrets Manager シークレット × 1

### 監視・ログ
- CloudWatch Log Group × 1
- CloudWatch Alarms（オプション）

## コスト見積もり（月額）

以下は東京リージョン（ap-northeast-1）での開発環境向け最小構成の概算です：

| サービス | 仕様 | 月額（USD） |
|---------|------|------------|
| ECS Fargate | 0.25 vCPU, 0.5GB RAM × 1タスク（24時間稼働） | ~$13 |
| ALB | 基本料金 + 最小データ転送 | ~$20 |
| Aurora PostgreSQL | db.t4g.small × 1（シングルAZ） | ~$24 |
| NAT Gateway | 1個 × 24時間（開発用は1個で十分） | ~$33 |
| Secrets Manager | 1シークレット | ~$0.40 |
| ECR | 1GB未満のイメージ | ~$0.10 |
| **合計** | | **約$90.50** |

### 詳細な料金計算

1. **ECS Fargate（0.25 vCPU, 0.5GB RAM）**
   - vCPU: 0.25 × $0.05/時間 × 730時間 = ~$9.13
   - メモリ: 0.5GB × $0.0055/GB/時間 × 730時間 = ~$2.01
   - ストレージ: 20GBのエフェメラルストレージは無料
   - 小計: ~$11.14/月（東京リージョンは若干高い可能性あり）

2. **Aurora PostgreSQL（db.t4g.small）**
   - インスタンス: $0.032/時間 × 730時間 = ~$23.36
   - ストレージ: 最小10GB × $0.12/GB = ~$1.20
   - I/O: 開発用途なら最小限
   - 小計: ~$24.56/月

3. **NAT Gateway**
   - 時間料金: $0.045/時間 × 730時間 = ~$32.85
   - データ処理: 開発用途なら最小限
   - 小計: ~$33/月

### さらなるコスト削減案

1. **開発時間のみ起動**
   - 平日9-18時のみ稼働（200時間/月）にすると約60%削減
   - ECS Fargate: ~$3/月
   - NAT Gateway: ~$9/月
   - Aurora: Stoppedインスタンスでストレージ料金のみ

2. **Aurora Serverless v2の検討**
   - 最小0.5 ACUから自動スケーリング
   - 開発環境では使用時のみ課金

3. **NAT Instanceの使用**
   - t4g.nanoインスタンス（$3-4/月）でNAT Gatewayを代替
   - 可用性は劣るが開発環境では十分

※実際の使用量により変動します
※無料利用枠を考慮していません
※日本の消費税が別途かかります

## セキュリティ考慮事項

1. **ネットワークセキュリティ**
   - プライベートサブネットでのECS/RDS実行
   - セキュリティグループによる厳格なアクセス制御
   - NACLによる追加の保護層

2. **データ保護**
   - Aurora RDSの暗号化
   - Secrets Managerでの機密情報管理
   - TLS/SSL通信の強制

3. **認証・認可**
   - Supabase JWTトークンの検証（変更なし）
   - IAMロールによる最小権限の原則

4. **監査・コンプライアンス**
   - CloudTrailによる操作ログ
   - VPC Flow Logsの有効化（オプション）

## 移行作業の詳細手順

### 1. プロジェクト名変更の実施

まず、以下のファイルを更新します：

#### ルートpackage.json
```json
{
  "name": "blog-aws-practice",
  // 他の設定...
}
```

#### packages/backend/package.json → packages/server/package.json
```json
{
  "name": "@blog-aws-practice/server",
  // 他の設定...
}
```

#### packages/frontend/package.json
```json
{
  "name": "@blog-aws-practice/frontend",
  // 他の設定...
}
```

### 2. Docker環境の構築

#### docker-compose.yml（ルートディレクトリ）
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: bloguser
      POSTGRES_PASSWORD: blogpassword
      POSTGRES_DB: blogdb
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U bloguser -d blogdb"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

### 3. Prismaスキーマの更新

packages/server/prisma/schema.prisma:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// 既存のモデル定義はそのまま維持
model User {
  id        Int      @id @default(autoincrement())
  sub       String   @unique
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  articles  Article[]
}

// 他のモデルも同様に維持
```

### 4. Express.jsサーバーの実装

packages/server/src/index.ts:
```typescript
import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import cors from 'cors';
import { json } from 'body-parser';
import { PrismaClient } from '@prisma/client';
import { resolvers } from './resolvers';
import { typeDefs } from './schema';
import { verifyJWT } from './auth';

const app = express();
const prisma = new PrismaClient();

async function startServer() {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });

  await server.start();

  app.use(
    '/graphql',
    cors({
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      credentials: true,
    }),
    json(),
    expressMiddleware(server, {
      context: async ({ req }) => {
        const token = req.headers.authorization?.replace('Bearer ', '');
        const user = token ? await verifyJWT(token) : null;
        return { prisma, user };
      },
    })
  );

  // ヘルスチェックエンドポイント
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy' });
  });

  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
```

### 5. Dockerfile作成

packages/server/Dockerfile:
```dockerfile
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
RUN corepack enable

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm prisma generate
RUN pnpm build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma

USER nodejs
EXPOSE 4000

CMD ["node", "dist/index.js"]
```

### 6. GitHub Actions ワークフロー

.github/workflows/deploy-server.yml:
```yaml
name: Deploy Server to ECS

on:
  push:
    branches:
      - main
      - develop
    paths:
      - 'packages/server/**'
      - '.github/workflows/deploy-server.yml'

env:
  AWS_REGION: ap-northeast-1
  ECR_REPOSITORY: blog-aws-practice-server
  ECS_SERVICE: blog-aws-practice-service
  ECS_CLUSTER: blog-aws-practice-cluster
  ECS_TASK_DEFINITION: blog-aws-practice-task
  CONTAINER_NAME: blog-aws-practice-server

jobs:
  deploy:
    name: Deploy
    runs-on: ubuntu-latest
    environment: ${{ github.ref == 'refs/heads/main' && 'production' || 'development' }}

    steps:
    - name: Checkout
      uses: actions/checkout@v4

    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v4
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: ${{ env.AWS_REGION }}

    - name: Login to Amazon ECR
      id: login-ecr
      uses: aws-actions/amazon-ecr-login@v2

    - name: Build, tag, and push image to Amazon ECR
      id: build-image
      env:
        ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        IMAGE_TAG: ${{ github.sha }}
      run: |
        cd packages/server
        docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
        docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
        echo "image=$ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG" >> $GITHUB_OUTPUT

    - name: Download task definition
      run: |
        aws ecs describe-task-definition \
          --task-definition ${{ env.ECS_TASK_DEFINITION }} \
          --query taskDefinition > task-definition.json

    - name: Fill in the new image ID in the Amazon ECS task definition
      id: task-def
      uses: aws-actions/amazon-ecs-render-task-definition@v1
      with:
        task-definition: task-definition.json
        container-name: ${{ env.CONTAINER_NAME }}
        image: ${{ steps.build-image.outputs.image }}

    - name: Deploy Amazon ECS task definition
      uses: aws-actions/amazon-ecs-deploy-task-definition@v1
      with:
        task-definition: ${{ steps.task-def.outputs.task-definition }}
        service: ${{ env.ECS_SERVICE }}
        cluster: ${{ env.ECS_CLUSTER }}
        wait-for-service-stability: true
```

## 移行チェックリスト

### 事前準備
- [ ] AWSアカウントの作成
- [ ] AWS CLIのインストールと設定
- [ ] IAMユーザーの作成（管理者権限）
- [ ] Dockerのインストール

### フェーズ1
- [ ] プロジェクト名の一括変更
- [ ] ディレクトリ名の変更（backend → server）
- [ ] Docker Composeファイルの作成
- [ ] Prismaスキーマの更新（PostgreSQL対応）
- [ ] ローカル環境での動作確認

### フェーズ2（AWSコンソール作業）
- [ ] VPCとサブネットの作成
- [ ] セキュリティグループの作成
- [ ] Aurora RDSクラスターの作成
- [ ] Secrets Managerの設定
- [ ] ECRリポジトリの作成
- [ ] ALBの作成と設定
- [ ] ECSクラスターの作成
- [ ] タスク定義の作成
- [ ] ECSサービスの作成

### フェーズ3
- [ ] GitHub Secretsの設定
- [ ] GitHub Actionsワークフローの作成
- [ ] 初回デプロイの実行
- [ ] デプロイメントの動作確認

### フェーズ4
- [ ] Frontend環境変数の更新（ALBのURL設定）
- [ ] CORSの設定確認
- [ ] エンドツーエンドテスト
- [ ] パフォーマンステスト

### フェーズ5
- [ ] Frontend .env.developmentの更新
- [ ] Frontend .env.productionの更新
- [ ] Cloudflare Workersへのデプロイ（開発）
- [ ] Cloudflare Workersへのデプロイ（本番）
- [ ] 最終動作確認
- [ ] ドキュメントの更新

## トラブルシューティングガイド

### よくある問題と解決方法

1. **ECSタスクが起動しない**
   - CloudWatch Logsでコンテナログを確認
   - タスク定義のメモリ/CPU設定を確認
   - セキュリティグループの設定を確認

2. **データベース接続エラー**
   - Secrets Managerの接続情報を確認
   - RDSのセキュリティグループを確認
   - VPCのルーティング設定を確認

3. **ALBヘルスチェック失敗**
   - ヘルスチェックパスが正しいか確認（/health）
   - タスクが正常に起動しているか確認
   - ターゲットグループの設定を確認

4. **GitHub Actionsデプロイ失敗**
   - AWS認証情報が正しく設定されているか確認
   - ECRへのpush権限があるか確認
   - ECSサービスの更新権限があるか確認

## 参考リンク

- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [Aurora PostgreSQL User Guide](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/)
- [AWS Secrets Manager](https://docs.aws.amazon.com/secretsmanager/)
- [GitHub Actions for Amazon ECS](https://github.com/aws-actions/amazon-ecs-deploy-task-definition)
- [Prisma with PostgreSQL](https://www.prisma.io/docs/concepts/database-connectors/postgresql)