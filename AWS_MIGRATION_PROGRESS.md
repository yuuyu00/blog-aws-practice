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

### 🚧 進行中の作業

なし（次フェーズの開始待ち）

### 📋 未着手の作業

#### フェーズ1: プロジェクト名変更とローカル環境整備
- [ ] Docker Composeファイルの作成（PostgreSQL）
- [ ] Prismaスキーマの更新（SQLite → PostgreSQL）
- [ ] PostgreSQL用マイグレーションファイルの作成
- [ ] Express.jsサーバーの実装（packages/server/src/index.ts）
- [ ] ヘルスチェックエンドポイントの追加
- [ ] Dockerfileの作成（packages/server/Dockerfile）
- [ ] ローカル環境での動作確認

#### フェーズ2: AWSインフラ構築（手動）
- [ ] AWSアカウントの準備
- [ ] VPCとサブネットの作成
  - VPC: 10.0.0.0/16
  - パブリックサブネット: 10.0.1.0/24, 10.0.2.0/24
  - プライベートサブネット: 10.0.11.0/24, 10.0.12.0/24
- [ ] セキュリティグループの作成
- [ ] Aurora PostgreSQL（db.t4g.small）の作成
- [ ] Secrets Managerの設定
- [ ] ECRリポジトリの作成
- [ ] ALBの作成と設定
- [ ] ECSクラスターとサービスの作成

#### フェーズ3: CI/CD構築
- [ ] GitHub Actionsワークフローの作成（.github/workflows/deploy-server.yml）
- [ ] GitHub Secretsの設定
- [ ] 初回デプロイの実行

#### フェーズ4: Frontend更新とテスト
- [ ] Frontend環境変数の更新（ALBのURLに変更）
- [ ] CORS設定の確認
- [ ] エンドツーエンドテスト
- [ ] ドキュメントの最終更新

## 重要な決定事項

1. **インスタンスタイプ**: t4g（Graviton2）を使用してコスト削減
2. **NAT Gateway**: 開発環境のため1個のみ使用
3. **Aurora構成**: シングルAZ、db.t4g.small（最小構成）
4. **ECS構成**: 0.25 vCPU, 0.5GB RAM（最小構成）

## 次のアクション

1. Docker Composeファイルの作成から開始
2. Prismaスキーマの PostgreSQL対応
3. Express.jsサーバーの実装

## 課題・懸念事項

- 特になし（現時点）

## 参考リンク

- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [Aurora PostgreSQL User Guide](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/)
- [Prisma with PostgreSQL](https://www.prisma.io/docs/concepts/database-connectors/postgresql)

---

最終更新: 2025-08-16