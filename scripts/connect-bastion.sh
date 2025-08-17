#!/bin/bash

# 踏み台ECSタスク経由でRDSにポートフォワーディング

set -e

# 変数設定
AWS_REGION="ap-northeast-1"
AWS_PROFILE="blog-aws-practice"
ECS_CLUSTER="blog-aws-practice-cluster"
SERVICE_NAME="blog-aws-practice-bastion"
LOCAL_PORT=5432
MODE=${1:-forward}  # forward or shell

echo "🔍 踏み台タスクのIDを取得中..."
TASK_ARN=$(aws ecs list-tasks \
  --cluster ${ECS_CLUSTER} \
  --service-name ${SERVICE_NAME} \
  --region ${AWS_REGION} \
  --profile ${AWS_PROFILE} \
  --query 'taskArns[0]' \
  --output text)

if [ -z "$TASK_ARN" ]; then
  echo "❌ 踏み台タスクが見つかりません。"
  echo "先に ./scripts/deploy-bastion.sh を実行してください。"
  exit 1
fi

TASK_ID=$(echo ${TASK_ARN} | cut -d'/' -f3)

if [ "$MODE" = "shell" ]; then
  echo "🚀 踏み台タスクのシェルに接続中..."
  echo ""
  echo "========================================="
  echo "利用可能なコマンド："
  echo "  npx prisma migrate deploy    # マイグレーション実行"
  echo "  npx prisma db pull           # DBスキーマ取得"
  echo "  npx tsx prisma/seeds.ts      # シード実行"
  echo "  psql \$DATABASE_URL          # PostgreSQL直接接続"
  echo "========================================="
  echo ""
  
  aws ecs execute-command \
    --cluster ${ECS_CLUSTER} \
    --task ${TASK_ID} \
    --container bastion \
    --interactive \
    --command "/bin/bash" \
    --region ${AWS_REGION} \
    --profile ${AWS_PROFILE}
else
  echo "🔍 タスクのランタイムIDを取得中..."
  RUNTIME_ID=$(aws ecs describe-tasks \
    --cluster ${ECS_CLUSTER} \
    --tasks ${TASK_ID} \
    --region ${AWS_REGION} \
    --profile ${AWS_PROFILE} \
    --query 'tasks[0].containers[0].runtimeId' \
    --output text)

  echo "🚀 ポートフォワーディングを開始..."
  echo ""
  echo "========================================="
  echo "PostgreSQL接続情報:"
  echo "  Host: localhost"
  echo "  Port: 5432"
  echo "  Database: blog_aws_practice"
  echo "  Username: postgres"
  echo "  Password: BlogAwsPractice2024!"
  echo ""
  echo "接続例:"
  echo "  psql -h localhost -U postgres -d blog_aws_practice"
  echo "========================================="
  echo ""
  echo "（Ctrl+C で終了）"
  
  # SSM Session Managerでポートフォワーディング
  aws ssm start-session \
    --target "ecs:${ECS_CLUSTER}_${TASK_ID}_${RUNTIME_ID}" \
    --document-name AWS-StartPortForwardingSessionToRemoteHost \
    --parameters "{\"host\":[\"localhost\"],\"portNumber\":[\"5432\"],\"localPortNumber\":[\"${LOCAL_PORT}\"]}" \
    --region ${AWS_REGION} \
    --profile ${AWS_PROFILE}
fi