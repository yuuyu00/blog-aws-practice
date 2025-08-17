#!/bin/bash

# ECRへのDockerイメージのビルドとプッシュ、ECSサービス更新スクリプト

set -e

# 変数設定
AWS_REGION="ap-northeast-1"
AWS_ACCOUNT_ID="664660631613"
ECR_REPOSITORY="blog-aws-practice-server"
IMAGE_TAG="latest"
AWS_PROFILE="blog-aws-practice"
ECS_CLUSTER="blog-aws-practice-cluster"
ECS_SERVICE="blog-aws-practice-server"

echo "📦 TypeScriptをビルド中..."
cd packages/server
pnpm build
cd ../..

echo "🔧 AWS ECRにログイン中..."
aws ecr get-login-password --region ${AWS_REGION} --profile ${AWS_PROFILE} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

echo "🏗️ Dockerイメージをビルド中 (AMD64アーキテクチャ)..."
# Dockerfileはモノレポのルートからビルドする必要がある
# ECS FargateはAMD64のみサポートするため、--platform linux/amd64を指定
docker build --platform linux/amd64 --no-cache -t ${ECR_REPOSITORY}:${IMAGE_TAG} -f packages/server/Dockerfile .

echo "🏷️ イメージにタグを付与中..."
docker tag ${ECR_REPOSITORY}:${IMAGE_TAG} ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY}:${IMAGE_TAG}

echo "🚀 ECRにイメージをプッシュ中..."
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY}:${IMAGE_TAG}

echo "🔄 ECSサービスを更新中..."
aws ecs update-service \
  --cluster ${ECS_CLUSTER} \
  --service ${ECS_SERVICE} \
  --force-new-deployment \
  --region ${AWS_REGION} \
  --profile ${AWS_PROFILE} \
  --output json > /dev/null

echo "⏳ サービスの更新を待機中..."
aws ecs wait services-stable \
  --cluster ${ECS_CLUSTER} \
  --services ${ECS_SERVICE} \
  --region ${AWS_REGION} \
  --profile ${AWS_PROFILE}

echo "✅ デプロイ完了！"
echo "イメージURI: ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY}:${IMAGE_TAG}"
echo ""
echo "📊 サービスの状態を確認:"
aws ecs describe-services \
  --cluster ${ECS_CLUSTER} \
  --services ${ECS_SERVICE} \
  --region ${AWS_REGION} \
  --profile ${AWS_PROFILE} \
  --query 'services[0].{DesiredCount:desiredCount,RunningCount:runningCount,PendingCount:pendingCount,Status:status}' \
  --output table