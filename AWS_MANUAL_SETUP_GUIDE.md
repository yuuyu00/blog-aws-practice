# AWS手動セットアップガイド

このガイドは、AWSコンソールを使用してblog-aws-practiceプロジェクトのインフラストラクチャを手動でセットアップする手順を詳細に記載しています。

## 前提条件

- AWSアカウントを持っていること
- AWSコンソールの言語設定を英語にしていること
- リージョン: **Asia Pacific (Tokyo) ap-northeast-1**

## 1. IAMユーザーの作成（CI/CD用）

### 1.1 IAMコンソールへアクセス
1. AWSマネジメントコンソールの検索バーに「**IAM**」と入力
2. 「**IAM**」をクリック

### 1.2 ユーザーの作成
1. 左側メニューから「**Users**」をクリック
2. 「**Create user**」ボタンをクリック
3. 以下を設定：
   - **User name**: `blog-aws-practice-deploy`
   - **Provide user access to the AWS Management Console**: チェックを外す
4. 「**Next**」をクリック

### 1.3 権限の設定
1. 「**Attach policies directly**」を選択
2. 以下のポリシーを検索して選択：
   - ✅ `AmazonEC2ContainerRegistryFullAccess`
   - ✅ `AmazonECS_FullAccess`
   - ✅ `AmazonRDSFullAccess`
   - ✅ `SecretsManagerReadWrite`
   - ✅ `AmazonVPCFullAccess`
   - ✅ `ElasticLoadBalancingFullAccess`
3. 「**Next**」をクリック
4. 「**Create user**」をクリック

### 1.4 アクセスキーの作成
1. 作成したユーザーをクリック
2. 「**Security credentials**」タブを選択
3. 「**Create access key**」をクリック
4. 「**Command Line Interface (CLI)**」を選択
5. 「**Next**」→「**Create access key**」
6. **Access key ID**と**Secret access key**を安全に保存
7. 「**Done**」をクリック

## 2. VPCとネットワークの構築

### 2.1 VPCの作成
1. 検索バーに「**VPC**」と入力し、VPCサービスへ移動
2. 左側メニューから「**Your VPCs**」をクリック
3. 「**Create VPC**」ボタンをクリック
4. 以下を設定：
   - **Name tag**: `blog-aws-practice-vpc`
   - **IPv4 CIDR block**: `10.0.0.0/16`
   - **IPv6 CIDR block**: No IPv6 CIDR block
   - **Tenancy**: Default
5. 「**Create VPC**」をクリック

### 2.2 サブネットの作成
1. 左側メニューから「**Subnets**」をクリック
2. 「**Create subnet**」ボタンをクリック
3. **VPC ID**: `blog-aws-practice-vpc`を選択
4. 以下の4つのサブネットを作成（「**Add new subnet**」で追加）：

   **パブリックサブネット1**:
   - **Subnet name**: `blog-aws-practice-public-1a`
   - **Availability Zone**: `ap-northeast-1a`
   - **IPv4 subnet CIDR block**: `10.0.1.0/24`

   **パブリックサブネット2**:
   - **Subnet name**: `blog-aws-practice-public-1c`
   - **Availability Zone**: `ap-northeast-1c`
   - **IPv4 subnet CIDR block**: `10.0.2.0/24`

   **プライベートサブネット1**:
   - **Subnet name**: `blog-aws-practice-private-1a`
   - **Availability Zone**: `ap-northeast-1a`
   - **IPv4 subnet CIDR block**: `10.0.11.0/24`

   **プライベートサブネット2**:
   - **Subnet name**: `blog-aws-practice-private-1c`
   - **Availability Zone**: `ap-northeast-1c`
   - **IPv4 subnet CIDR block**: `10.0.12.0/24`

5. 「**Create subnet**」をクリック

### 2.3 インターネットゲートウェイの作成
1. 左側メニューから「**Internet gateways**」をクリック
2. 「**Create internet gateway**」ボタンをクリック
3. **Name tag**: `blog-aws-practice-igw`
4. 「**Create internet gateway**」をクリック
5. 作成後、「**Actions**」→「**Attach to VPC**」
6. `blog-aws-practice-vpc`を選択
7. 「**Attach internet gateway**」をクリック

### 2.4 NAT Gatewayの作成
1. 左側メニューから「**NAT gateways**」をクリック
2. 「**Create NAT gateway**」ボタンをクリック
3. 以下を設定：
   - **Name**: `blog-aws-practice-nat`
   - **Subnet**: `blog-aws-practice-public-1a`を選択
   - **Connectivity type**: Public
   - 「**Allocate Elastic IP**」ボタンをクリック
4. 「**Create NAT gateway**」をクリック
5. ステータスが「**Available**」になるまで待つ（約2-3分）

### 2.5 ルートテーブルの設定

#### パブリックサブネット用ルートテーブル
1. 左側メニューから「**Route tables**」をクリック
2. 「**Create route table**」ボタンをクリック
3. 以下を設定：
   - **Name**: `blog-aws-practice-public-rt`
   - **VPC**: `blog-aws-practice-vpc`を選択
4. 「**Create route table**」をクリック
5. 作成したルートテーブルを選択
6. 「**Routes**」タブ→「**Edit routes**」
7. 「**Add route**」をクリック：
   - **Destination**: `0.0.0.0/0`
   - **Target**: Internet Gateway → `blog-aws-practice-igw`
8. 「**Save changes**」をクリック
9. 「**Subnet associations**」タブ→「**Edit subnet associations**」
10. 以下を選択：
    - ✅ `blog-aws-practice-public-1a`
    - ✅ `blog-aws-practice-public-1c`
11. 「**Save associations**」をクリック

#### プライベートサブネット用ルートテーブル（メインルートテーブル）
1. **Main**が「**Yes**」のルートテーブルを選択
2. Name欄をクリックして`blog-aws-practice-private-rt`と入力
3. 「**Routes**」タブ→「**Edit routes**」
4. 「**Add route**」をクリック：
   - **Destination**: `0.0.0.0/0`
   - **Target**: NAT Gateway → `blog-aws-practice-nat`
5. 「**Save changes**」をクリック
6. 「**Subnet associations**」タブ→「**Edit subnet associations**」
7. 以下を選択：
   - ✅ `blog-aws-practice-private-1a`
   - ✅ `blog-aws-practice-private-1c`
8. 「**Save associations**」をクリック

## 3. セキュリティグループの作成

### 3.1 ALB用セキュリティグループ
1. 左側メニューから「**Security Groups**」をクリック
2. 「**Create security group**」ボタンをクリック
3. 以下を設定：
   - **Security group name**: `blog-aws-practice-alb-sg`
   - **Description**: `Security group for ALB`
   - **VPC**: `blog-aws-practice-vpc`を選択
4. **Inbound rules**で「**Add rule**」を2回クリック：
   - Rule 1: **Type**: HTTP, **Source**: Anywhere-IPv4 (0.0.0.0/0)
   - Rule 2: **Type**: HTTPS, **Source**: Anywhere-IPv4 (0.0.0.0/0)
5. 「**Create security group**」をクリック

### 3.2 ECS用セキュリティグループ
1. 「**Create security group**」ボタンをクリック
2. 以下を設定：
   - **Security group name**: `blog-aws-practice-ecs-sg`
   - **Description**: `Security group for ECS tasks`
   - **VPC**: `blog-aws-practice-vpc`を選択
3. **Inbound rules**で「**Add rule**」をクリック：
   - **Type**: Custom TCP
   - **Port range**: `4000`
   - **Source**: Custom → `blog-aws-practice-alb-sg`を選択
4. 「**Create security group**」をクリック

### 3.3 RDS用セキュリティグループ
1. 「**Create security group**」ボタンをクリック
2. 以下を設定：
   - **Security group name**: `blog-aws-practice-rds-sg`
   - **Description**: `Security group for RDS database`
   - **VPC**: `blog-aws-practice-vpc`を選択
3. **Inbound rules**で「**Add rule**」をクリック：
   - **Type**: PostgreSQL
   - **Source**: Custom → `blog-aws-practice-ecs-sg`を選択
4. 「**Create security group**」をクリック

## 4. RDS PostgreSQLの作成

### 4.1 サブネットグループの作成
1. 検索バーに「**RDS**」と入力し、RDSサービスへ移動
2. 左側メニューから「**Subnet groups**」をクリック
3. 「**Create DB subnet group**」ボタンをクリック
4. 以下を設定：
   - **Name**: `blog-aws-practice-db-subnet-group`
   - **Description**: `Subnet group for blog-aws-practice database`
   - **VPC**: `blog-aws-practice-vpc`を選択
5. **Add subnets**:
   - **Availability Zones**: `ap-northeast-1a`と`ap-northeast-1c`を選択
   - **Subnets**: 
     - `10.0.11.0/24` (blog-aws-practice-private-1a)
     - `10.0.12.0/24` (blog-aws-practice-private-1c)
6. 「**Create**」をクリック

### 4.2 データベースの作成
1. 左側メニューから「**Databases**」をクリック
2. 「**Create database**」ボタンをクリック
3. 以下を設定：

   **Choose a database creation method**:
   - 「**Standard create**」を選択

   **Engine options**:
   - **Engine type**: PostgreSQL
   - **Engine Version**: PostgreSQL 17.4-R1（または最新版）

   **Templates**:
   - 「**Free tier**」を選択（利用可能な場合）

   **Settings**:
   - **DB instance identifier**: `blog-aws-practice-db`
   - **Master username**: `postgres`
   - **Credentials management**: Self managed
   - **Master password**: 安全なパスワードを設定（記録しておく）

   **Instance configuration**:
   - **DB instance class**: db.t4g.micro（Free tier）

   **Storage**:
   - **Storage type**: General Purpose SSD (gp3)
   - **Allocated storage**: 20 GiB
   - **Storage autoscaling**: チェックを外す

   **Connectivity**:
   - **Compute resource**: Don't connect to an EC2 compute resource
   - **Network type**: IPv4
   - **Virtual private cloud (VPC)**: `blog-aws-practice-vpc`を選択
   - **DB subnet group**: `blog-aws-practice-db-subnet-group`
   - **Public access**: No
   - **VPC security group**: Choose existing → `blog-aws-practice-rds-sg`を選択
   - デフォルトのセキュリティグループは削除

   **Database authentication**:
   - 「**Password authentication**」を選択

   **Monitoring**:
   - 「**Database Insights - Standard**」を選択

   **Additional configuration**を展開:
   - **Initial database name**: `blog_aws_practice`
   - その他はデフォルト

4. 「**Create database**」をクリック
5. 作成完了まで5-10分待つ

## 5. ECRリポジトリの作成

1. 検索バーに「**ECR**」と入力し、Elastic Container Registryへ移動
2. 「**Create repository**」ボタンをクリック
3. 以下を設定：
   - **Visibility settings**: Private
   - **Repository name**: `blog-aws-practice-server`
   - **Tag immutability**: Mutable
   - **Scan on push**: 有効にする
   - **Encryption settings**: AES-256（デフォルト）
4. 「**Create repository**」をクリック
5. 作成されたリポジトリのURIをメモする

## 6. Application Load Balancerの作成

### 6.1 ターゲットグループの作成
1. 検索バーに「**EC2**」と入力し、EC2サービスへ移動
2. 左側メニューから「**Target Groups**」をクリック
3. 「**Create target group**」ボタンをクリック
4. 以下を設定：
   - **Choose a target type**: IP addresses
   - **Target group name**: `blog-aws-practice-tg`
   - **Protocol**: HTTP
   - **Port**: 4000
   - **VPC**: `blog-aws-practice-vpc`を選択
   - **Protocol version**: HTTP1
   - **Health check path**: `/health`
5. 「**Next**」をクリック
6. ターゲットは登録せずに「**Create target group**」をクリック

### 6.2 ALBの作成
1. 左側メニューから「**Load Balancers**」をクリック
2. 「**Create load balancer**」ボタンをクリック
3. 「**Application Load Balancer**」の「**Create**」をクリック
4. 以下を設定：

   **Basic configuration**:
   - **Load balancer name**: `blog-aws-practice-alb`
   - **Scheme**: Internet-facing
   - **IP address type**: IPv4

   **Network mapping**:
   - **VPC**: `blog-aws-practice-vpc`を選択
   - **Mappings**: 
     - ✅ ap-northeast-1a → `blog-aws-practice-public-1a`
     - ✅ ap-northeast-1c → `blog-aws-practice-public-1c`

   **Security groups**:
   - `blog-aws-practice-alb-sg`を選択
   - デフォルトのセキュリティグループは削除

   **Listeners and routing**:
   - **Protocol**: HTTP
   - **Port**: 80
   - **Default action**: Forward to → `blog-aws-practice-tg`

5. 「**Create load balancer**」をクリック
6. ALBのDNS名をメモする

## 7. Secrets Managerの設定

### 7.1 データベース認証情報の保存
1. 検索バーに「**Secrets Manager**」と入力し、Secrets Managerへ移動
2. 「**Store a new secret**」ボタンをクリック
3. **Secret type**:
   - 「**Credentials for Amazon RDS database**」を選択
4. **Credentials**:
   - **User name**: `postgres`
   - **Password**: RDS作成時に設定したパスワードを入力
5. **Database**:
   - リストから`blog-aws-practice-db`を選択
6. 「**Next**」をクリック
7. **Secret name and description**:
   - **Secret name**: `blog-aws-practice/rds`
   - **Description**: `RDS PostgreSQL credentials for blog-aws-practice`
8. 「**Next**」をクリック
9. **Configure rotation**: スキップ（「**Next**」をクリック）
10. レビュー画面で確認し、「**Store**」をクリック

### 7.2 Supabase認証情報の保存
1. 「**Store a new secret**」ボタンをクリック
2. **Secret type**:
   - 「**Other type of secret**」を選択
3. **Key/value pairs**で以下を追加（「**+ Add row**」で行を追加）:
   - Key: `SUPABASE_URL`, Value: SupabaseプロジェクトのURL
   - Key: `SUPABASE_ANON_KEY`, Value: SupabaseのAnon Key
   - Key: `SUPABASE_JWT_SECRET`, Value: SupabaseのJWT Secret
4. 「**Next**」をクリック
5. **Secret name and description**:
   - **Secret name**: `blog-aws-practice/supabase`
   - **Description**: `Supabase credentials for blog-aws-practice`
6. 「**Next**」→「**Next**」→「**Store**」

## 8. IAMロールの作成

### 8.1 ECSタスク実行ロールの作成
1. 検索バーに「**IAM**」と入力し、IAMへ移動
2. 左側メニューから「**Roles**」をクリック
3. 「**Create role**」ボタンをクリック
4. **Select trusted entity**:
   - 「**AWS service**」を選択
   - **Use case**で「**Elastic Container Service**」を探す
   - 「**Elastic Container Service Task**」を選択
5. 「**Next**」をクリック
6. **Add permissions**:
   - ✅ `AmazonECSTaskExecutionRolePolicy`（デフォルトで選択済み）
   - ✅ `SecretsManagerReadWrite`を検索して追加
7. 「**Next**」をクリック
8. **Name, review, and create**:
   - **Role name**: `blog-aws-practice-ecs-task-execution-role`
   - **Description**: `ECS task execution role for blog-aws-practice`
9. 「**Create role**」をクリック

## 9. CloudWatch Logsグループの作成

1. 検索バーに「**CloudWatch**」と入力し、CloudWatchへ移動
2. 左側メニューから「**Log groups**」をクリック
3. 「**Create log group**」ボタンをクリック
4. **Log group name**: `/ecs/blog-aws-practice`
5. 「**Create**」をクリック

## 10. ECSクラスターの作成

### 10.1 ECSサービスリンクロールの確認
初めてECSを使用する場合、サービスリンクロールが必要です。エラーが出た場合は以下を実行：

1. IAMコンソールへ移動
2. 「**Roles**」→「**Create role**」
3. 「**AWS service**」→「**Elastic Container Service**」を選択
4. そのまま作成を完了

### 10.2 クラスターの作成
1. 検索バーに「**ECS**」と入力し、Elastic Container Serviceへ移動
2. 左側メニューから「**Clusters**」をクリック
3. 「**Create cluster**」ボタンをクリック
4. 以下を設定：
   - **Cluster name**: `blog-aws-practice-cluster`
   - **Infrastructure**: AWS Fargate (serverless)のみ選択
5. 「**Create**」をクリック

## 11. GitHub Actionsの設定

### 11.1 GitHub Secretsの設定
1. GitHubリポジトリの「**Settings**」タブへ移動
2. 左メニューから「**Secrets and variables**」→「**Actions**」をクリック
3. 「**New repository secret**」ボタンをクリックして以下を追加：

   **AWS認証情報**:
   - Name: `AWS_ACCESS_KEY_ID`
   - Secret: IAMユーザーのアクセスキーID
   
   - Name: `AWS_SECRET_ACCESS_KEY`
   - Secret: IAMユーザーのシークレットアクセスキー

   **Cloudflare認証情報**:
   - Name: `CLOUDFLARE_API_TOKEN`
   - Secret: Cloudflare API Token（Workers Scripts:Edit権限）
   
   - Name: `CLOUDFLARE_ACCOUNT_ID`
   - Secret: CloudflareアカウントID

### 11.2 GitHub Actionsワークフローの確認
プロジェクトには以下のワークフローが設定済み：
- `.github/workflows/deploy-server.yml`: ECSへのサーバーデプロイ
- `.github/workflows/deploy.yml`: Cloudflare Workersへのフロントエンドデプロイ

## 12. Cloudflare Workers Proxyの設定

### 12.1 プロキシの必要性
- CloudflareのHTTPSからALBのHTTPへの通信がMixed Contentでブロックされる
- 解決策: Cloudflare Workers Proxyを経由してHTTPS→HTTP変換

### 12.2 プロキシの構成
- `packages/proxy`: ALBへのリクエストをプロキシ
- ALBエンドポイント: `http://blog-aws-practice-alb-169089192.ap-northeast-1.elb.amazonaws.com`
- CORSヘッダーを自動付与

## 作成したリソースの確認

以下のリソースが作成されていることを確認してください：

### ネットワーク
- VPC: `blog-aws-practice-vpc` (10.0.0.0/16)
- パブリックサブネット: 2つ（1a, 1c）
- プライベートサブネット: 2つ（1a, 1c）
- インターネットゲートウェイ: 1つ
- NAT Gateway: 1つ
- ルートテーブル: 2つ（パブリック用、プライベート用）

### セキュリティ
- セキュリティグループ: 3つ（ALB用、ECS用、RDS用）

### コンピューティング・ストレージ
- RDS PostgreSQL: `blog-aws-practice-db`
- ECRリポジトリ: `blog-aws-practice-server`
- ALB: `blog-aws-practice-alb`
- ターゲットグループ: `blog-aws-practice-tg`
- ECSクラスター: `blog-aws-practice-cluster`

### IAM
- IAMユーザー: `blog-aws-practice-deploy`（アクセスキー付き）

## 重要な情報のメモ

以下の情報は後で使用するため、必ずメモしておいてください：

- **IAMアクセスキーID**: （GitHub Secretsに設定）
- **IAMシークレットアクセスキー**: （GitHub Secretsに設定）
- **ECR URI**: `[アカウントID].dkr.ecr.ap-northeast-1.amazonaws.com/blog-aws-practice-server`
- **ALB DNS名**: `blog-aws-practice-alb-[ランダム文字列].ap-northeast-1.elb.amazonaws.com`
- **RDS エンドポイント**: `blog-aws-practice-db.[ランダム文字列].ap-northeast-1.rds.amazonaws.com`
- **RDS パスワード**: （設定したパスワード）

## デプロイ手順

### Dockerイメージのビルドとプッシュ

```bash
# AWS CLIの認証
aws configure --profile blog-aws-practice

# ECRログイン
aws ecr get-login-password --region ap-northeast-1 --profile blog-aws-practice | \
  docker login --username AWS --password-stdin 664660631613.dkr.ecr.ap-northeast-1.amazonaws.com

# Dockerイメージのビルド（AMD64アーキテクチャ）
cd /path/to/blog-aws-practice
docker build --platform linux/amd64 -t blog-aws-practice-server -f packages/server/Dockerfile .

# タグ付け
docker tag blog-aws-practice-server:latest \
  664660631613.dkr.ecr.ap-northeast-1.amazonaws.com/blog-aws-practice-server:latest

# プッシュ
docker push 664660631613.dkr.ecr.ap-northeast-1.amazonaws.com/blog-aws-practice-server:latest
```

### ECSタスク定義の作成
1. ECSコンソールで「**Task definitions**」→「**Create new task definition**」
2. Fargate互換の設定で作成
3. Secrets Managerとの統合を設定

### ECSサービスのデプロイ
1. ECSクラスターで「**Services**」→「**Create**」
2. 作成したタスク定義を選択
3. ALBのターゲットグループと連携

### CI/CDパイプライン
GitHub Actionsが設定済みのため、`develop`ブランチへのプッシュで自動デプロイされます。

## トラブルシューティング

### ECSクラスター作成時のエラー
「ECS service linked role」に関するエラーが出た場合：
1. IAMでAWSServiceRoleForECSが存在することを確認
2. 1-2分待ってから再試行
3. ブラウザをリフレッシュして再試行

### RDS接続エラー
- セキュリティグループのインバウンドルールを確認
- サブネットグループが正しく設定されているか確認
- VPCとサブネットの設定を確認

### ALBヘルスチェック失敗
- ターゲットグループのヘルスチェックパスが`/health`になっているか確認
- ECSタスクが正しく起動しているか確認
- セキュリティグループの設定を確認

### Mixed Content エラー
- HTTPS（Cloudflare）からHTTP（ALB）への通信がブロックされる
- 解決策: Cloudflare Workers Proxyを使用してHTTPS→HTTP変換

### JWT検証エラー
- Secrets Managerに正しいSupabase JWT Secretが設定されているか確認
- ECSタスク実行ロールにSecretsManagerReadWrite権限があるか確認
- 環境変数が正しくタスクに渡されているか確認

### Cloudflare API Token作成
1. Cloudflareダッシュボード→My Profile→API Tokens
2. Create Token→Custom token
3. 必要な権限:
   - Account - Workers Scripts:Edit
   - Account - Account Settings:Read
4. GitHub Secretsに`CLOUDFLARE_API_TOKEN`として設定