# AWS移行プロジェクト進捗管理

このドキュメントは、Apollo Cloudflare ReactプロジェクトをAWS ECS Fargateに移行する作業の進捗を管理するためのものです。

## プロジェクト概要

- **目的**: Cloudflare Workers上のApollo ServerをAWS ECS Fargateに移行し、AWSインフラ構築の学習を深める
- **開始日**: 2025-08-16
- **移行計画書**: [AWS_MIGRATION_PLAN.md](./AWS_MIGRATION_PLAN.md)

## 現在の状況

### ✅ 完了した作業

#### フェーズ0: 準備作業
- [x] AWS移行計画書（AWS_MIGRATION_PLAN.md）の作成
- [x] プロジェクト名の一括変更
  - apollo-cloudflare-react → blog-aws-practice
  - @apollo-cloudflare-react/backend → @blog-aws-practice/server
  - @apollo-cloudflare-react/frontend → @blog-aws-practice/frontend
- [x] ディレクトリ名の変更（packages/backend → packages/server）
- [x] 全設定ファイルの更新
  - package.json（ルート、server、frontend）
  - wrangler.toml（server、frontend）
  - 環境変数ファイル（.env.staging、.env.production）
  - README.md、CLAUDE.md
- [x] コスト見積もりの最適化（開発環境向け最小構成）
  - 月額$265.50 → $90.50に削減
  - ECS Fargate: 0.25 vCPU, 0.5GB RAM
  - Aurora PostgreSQL: db.t4g.small × 1
  - NAT Gateway: 1個のみ

#### フェーズ1: ローカル環境整備
- [x] Docker Composeファイルの作成（PostgreSQL） - 完了: 2025-08-16
- [x] Prismaスキーマの更新（SQLite → PostgreSQL）
- [x] PostgreSQL用マイグレーションファイルの作成
- [x] Express.jsサーバーの実装（packages/server/src/express.ts）
- [x] ヘルスチェックエンドポイントの追加
- [x] Dockerfileの作成（packages/server/Dockerfile）
- [x] ローカル環境での動作確認
- [x] Cloudflare関連の依存関係とファイルの削除
  - Cloudflare Workers専用ファイル（index.ts、db.ts）
  - wrangler.toml、.dev.vars
  - 関連パッケージ（@as-integrations/cloudflare-workers等）
- [x] Apollo Server 5へのアップグレード
  - @apollo/server v5.0.0への移行
  - @as-integrations/express5の導入
  - Apollo Sandbox対応（開発環境）
- [x] ECS Fargate向け最適化
  - グレースフルシャットダウンの実装（SIGTERM/SIGINT）
  - ヘルスチェックエンドポイントの強化
  - グローバルミドルウェアの最適化
- [x] フェーズ1の最終整備 - 完了: 2025-08-17
  - standalone.tsの削除（不要ファイル）
  - .dockerignoreファイルの作成
  - Docker関連便利スクリプトの追加（docker:up, docker:down等）
  - PostgreSQL用シードデータの修正と動作確認（3ユーザー、9記事、3カテゴリー）

#### フェーズ2: AWSインフラ構築（手動）
- [x] AWSアカウントの準備 - 完了: 2025-08-17
- [x] IAMユーザーの作成（CI/CD用）
  - ユーザー名: blog-aws-practice-deploy
  - 必要な権限ポリシーをアタッチ
  - アクセスキーを生成・保存
- [x] VPCとサブネットの作成
  - VPC: blog-aws-practice-vpc (10.0.0.0/16)
  - パブリックサブネット: 10.0.1.0/24 (1a), 10.0.2.0/24 (1c)
  - プライベートサブネット: 10.0.11.0/24 (1a), 10.0.12.0/24 (1c)
- [x] ネットワーク構成
  - インターネットゲートウェイ: blog-aws-practice-igw
  - NAT Gateway: blog-aws-practice-nat（パブリックサブネット1aに配置）
  - ルートテーブル: パブリック用とプライベート用を設定
- [x] セキュリティグループの作成
  - ALB用: blog-aws-practice-alb-sg（HTTP/HTTPS from 0.0.0.0/0）
  - ECS用: blog-aws-practice-ecs-sg（Port 4000 from ALB-SG）
  - RDS用: blog-aws-practice-rds-sg（Port 5432 from ECS-SG）
- [x] RDS PostgreSQL（db.t4g.micro）の作成
  - インスタンス: blog-aws-practice-db
  - エンジン: PostgreSQL 17.4-R1
  - Free tier利用（db.t4g.micro）
  - 初期データベース: blog_aws_practice
- [x] ECRリポジトリの作成
  - リポジトリ名: blog-aws-practice-server
  - URI: 664660631613.dkr.ecr.ap-northeast-1.amazonaws.com/blog-aws-practice-server
- [x] ALBの作成と設定
  - ターゲットグループ: blog-aws-practice-tg（Port 4000, Health check: /health）
  - ロードバランサー: blog-aws-practice-alb
  - DNS名: blog-aws-practice-alb-169089192.ap-northeast-1.elb.amazonaws.com
- [x] ECSクラスターの作成
  - クラスター名: blog-aws-practice-cluster
  - Fargate（サーバーレス）構成
- [x] AWS手動セットアップガイドの作成（AWS_MANUAL_SETUP_GUIDE.md）

### 🚧 進行中の作業

なし

### 📋 未着手の作業

#### フェーズ3: CI/CD構築
- [ ] GitHub Actionsワークフローの作成（.github/workflows/deploy-server.yml）
- [ ] GitHub Secretsの設定
- [ ] 初回デプロイの実行

#### フェーズ4: Frontend更新とテスト
- [ ] Frontend環境変数の更新（ALBのURLに変更）
- [ ] CORS設定の確認
- [ ] エンドツーエンドテスト
- [ ] パフォーマンステスト

#### フェーズ5: Frontend Cloudflareデプロイ
- [ ] Frontend .env.developmentの更新（開発用ALBエンドポイント）
- [ ] Frontend .env.productionの更新（本番用ALBエンドポイント）
- [ ] ServerのCORS設定でCloudflare WorkersのURLを許可
- [ ] Cloudflare Workersへのデプロイ（開発）
- [ ] Cloudflare Workersへのデプロイ（本番）
- [ ] 最終動作確認
- [ ] ドキュメントの最終更新

## 重要な決定事項

1. **インスタンスタイプ**: t4g（Graviton2）を使用してコスト削減
2. **NAT Gateway**: 開発環境のため1個のみ使用
3. **RDS PostgreSQL**: Free tier利用のためAuroraではなく通常のRDS PostgreSQL（db.t4g.micro）を使用
4. **ECS構成**: 0.25 vCPU, 0.5GB RAM（最小構成）
5. **PostgreSQLバージョン**: 17.4-R1（最新版）を使用

## 重要な情報

- **ECR URI**: `664660631613.dkr.ecr.ap-northeast-1.amazonaws.com/blog-aws-practice-server`
- **ALB DNS名**: `blog-aws-practice-alb-169089192.ap-northeast-1.elb.amazonaws.com`
- **RDS エンドポイント**: RDSコンソールで確認が必要
- **IAMユーザー**: blog-aws-practice-deploy（アクセスキーは安全に保管）

## 次のアクション

1. RDSエンドポイントの確認とSecrets Manager設定
2. Dockerイメージのビルドとプッシュ
3. ECSタスク定義とサービスの作成
4. GitHub Actionsワークフローの設定

## 課題・懸念事項

- ECSクラスター作成時に一度サービスリンクロールのエラーが発生したが、再試行で解決

## 参考リンク

- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [Aurora PostgreSQL User Guide](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/)
- [Prisma with PostgreSQL](https://www.prisma.io/docs/concepts/database-connectors/postgresql)

---

最終更新: 2025-08-17 16:45 JST (フェーズ2完了 - AWSインフラ構築完了)