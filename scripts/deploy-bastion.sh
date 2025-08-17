#!/bin/bash

# 踏み台ECSタスクのデプロイスクリプト

set -e

# 変数設定
AWS_REGION="ap-northeast-1"
AWS_ACCOUNT_ID="664660631613"
ECR_REPOSITORY="blog-aws-practice-bastion"
IMAGE_TAG="latest"
AWS_PROFILE="blog-aws-practice"
ECS_CLUSTER="blog-aws-practice-cluster"
TASK_DEFINITION="blog-aws-practice-bastion-task"
SERVICE_NAME="blog-aws-practice-bastion"

echo "🏗️ 踏み台用Dockerイメージをビルド中..."
docker build --platform linux/amd64 -t ${ECR_REPOSITORY}:${IMAGE_TAG} -f packages/server/Dockerfile.bastion .

echo "🔧 AWS ECRにログイン中..."
aws ecr get-login-password --region ${AWS_REGION} --profile ${AWS_PROFILE} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

echo "📦 ECRリポジトリを作成（既存の場合はスキップ）..."
aws ecr create-repository --repository-name ${ECR_REPOSITORY} --region ${AWS_REGION} --profile ${AWS_PROFILE} 2>/dev/null || true

echo "🏷️ イメージにタグを付与中..."
docker tag ${ECR_REPOSITORY}:${IMAGE_TAG} ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY}:${IMAGE_TAG}

echo "🚀 ECRにイメージをプッシュ中..."
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY}:${IMAGE_TAG}

echo "📝 踏み台用タスク定義を作成中..."
cat > /tmp/bastion-task-definition.json <<EOF
{
  "family": "${TASK_DEFINITION}",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::${AWS_ACCOUNT_ID}:role/blog-aws-practice-ecs-task-execution-role",
  "taskRoleArn": "arn:aws:iam::${AWS_ACCOUNT_ID}:role/blog-aws-practice-ecs-task-role",
  "containerDefinitions": [
    {
      "name": "bastion",
      "image": "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY}:${IMAGE_TAG}",
      "essential": true,
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:${AWS_REGION}:${AWS_ACCOUNT_ID}:secret:blog-aws-practice/database-url:DATABASE_URL::"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/blog-aws-practice-bastion",
          "awslogs-region": "${AWS_REGION}",
          "awslogs-stream-prefix": "bastion"
        }
      }
    }
  ]
}
EOF

echo "📋 タスク定義を登録中..."
aws ecs register-task-definition \
  --cli-input-json file:///tmp/bastion-task-definition.json \
  --region ${AWS_REGION} \
  --profile ${AWS_PROFILE} > /dev/null

echo "🔧 CloudWatch Logsグループを作成..."
aws logs create-log-group \
  --log-group-name /ecs/blog-aws-practice-bastion \
  --region ${AWS_REGION} \
  --profile ${AWS_PROFILE} 2>/dev/null || true

echo "🚀 踏み台サービスを作成/更新中..."
# サービスが存在するか確認
if aws ecs describe-services --cluster ${ECS_CLUSTER} --services ${SERVICE_NAME} --region ${AWS_REGION} --profile ${AWS_PROFILE} 2>/dev/null | grep -q "ACTIVE"; then
  echo "既存のサービスを更新中..."
  aws ecs update-service \
    --cluster ${ECS_CLUSTER} \
    --service ${SERVICE_NAME} \
    --task-definition ${TASK_DEFINITION} \
    --force-new-deployment \
    --region ${AWS_REGION} \
    --profile ${AWS_PROFILE} > /dev/null
else
  echo "新しいサービスを作成中..."
  aws ecs create-service \
    --cluster ${ECS_CLUSTER} \
    --service-name ${SERVICE_NAME} \
    --task-definition ${TASK_DEFINITION} \
    --desired-count 1 \
    --launch-type FARGATE \
    --network-configuration "awsvpcConfiguration={subnets=[subnet-003810fb3b283d928,subnet-0df7ad8d4df193a94],securityGroups=[sg-0593f019c1e657f15],assignPublicIp=DISABLED}" \
    --enable-execute-command \
    --region ${AWS_REGION} \
    --profile ${AWS_PROFILE} > /dev/null
fi

echo "⏳ サービスの起動を待機中..."
aws ecs wait services-stable \
  --cluster ${ECS_CLUSTER} \
  --services ${SERVICE_NAME} \
  --region ${AWS_REGION} \
  --profile ${AWS_PROFILE}

echo "✅ 踏み台タスクのデプロイ完了！"
echo ""
echo "📌 踏み台タスクに接続する方法："
echo ""
echo "# タスクIDを取得"
echo "TASK_ID=\$(aws ecs list-tasks --cluster ${ECS_CLUSTER} --service-name ${SERVICE_NAME} --region ${AWS_REGION} --profile ${AWS_PROFILE} --query 'taskArns[0]' --output text | cut -d'/' -f3)"
echo ""
echo "# ECS Execで接続"
echo "aws ecs execute-command \\"
echo "  --cluster ${ECS_CLUSTER} \\"
echo "  --task \$TASK_ID \\"
echo "  --container bastion \\"
echo "  --interactive \\"
echo "  --command \"/bin/bash\" \\"
echo "  --region ${AWS_REGION} \\"
echo "  --profile ${AWS_PROFILE}"
echo ""
echo "# 接続後、以下のコマンドでマイグレーションを実行:"
echo "npx prisma migrate deploy"