# GitHub Secrets設定ガイド

このドキュメントでは、CI/CDパイプラインに必要なGitHub Secretsの設定方法を説明します。

## 必要なSecrets

以下の2つのSecretsを設定する必要があります：

1. `AWS_ACCESS_KEY_ID`
2. `AWS_SECRET_ACCESS_KEY`

## 設定手順

### 1. GitHubリポジトリの設定ページへアクセス

1. GitHubで対象リポジトリ（`blog-aws-practice`）を開く
2. **Settings**タブをクリック
3. 左側メニューの**Security**セクションから**Secrets and variables** → **Actions**を選択

### 2. Secretsの追加

#### AWS_ACCESS_KEY_ID

1. **New repository secret**ボタンをクリック
2. 以下を入力：
   - **Name**: `AWS_ACCESS_KEY_ID`
   - **Secret**: IAMユーザー（blog-aws-practice-deploy）のアクセスキーID
3. **Add secret**をクリック

#### AWS_SECRET_ACCESS_KEY

1. **New repository secret**ボタンをクリック
2. 以下を入力：
   - **Name**: `AWS_SECRET_ACCESS_KEY`
   - **Secret**: IAMユーザー（blog-aws-practice-deploy）のシークレットアクセスキー
3. **Add secret**をクリック

## 確認方法

設定が完了すると、**Actions secrets**セクションに以下が表示されます：

- AWS_ACCESS_KEY_ID - Updated now
- AWS_SECRET_ACCESS_KEY - Updated now

## セキュリティに関する注意事項

- これらの認証情報は絶対に公開しないでください
- 定期的にアクセスキーをローテーションすることを推奨します
- 最小権限の原則に従い、必要な権限のみを付与したIAMユーザーを使用してください

## トラブルシューティング

### デプロイが失敗する場合

1. **Secretsが正しく設定されているか確認**
   - タイポがないか
   - 値の前後に余計なスペースが入っていないか

2. **IAMユーザーの権限を確認**
   - ECR、ECS、EC2の必要な権限があるか
   - アクセスキーが有効か

3. **GitHub Actionsのログを確認**
   - Actions タブでワークフローの実行ログを確認
   - エラーメッセージから原因を特定

## 関連ドキュメント

- [GitHub Encrypted Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [AWS IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)