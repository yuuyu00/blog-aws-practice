#!/bin/bash

# Import existing AWS resources into Terraform state

echo "Starting import of existing AWS resources..."

# VPC (already imported as aws_vpc.name, need to remove old state first)
echo "Removing old VPC state..."
terraform state rm aws_vpc.name 2>/dev/null || true

echo "Importing VPC..."
terraform import aws_vpc.main vpc-0a05f7ea441e4366a

# Internet Gateway
echo "Importing Internet Gateway..."
terraform import aws_internet_gateway.main igw-07365f1a96ac22ac3

# Subnets
echo "Importing Subnets..."
terraform import aws_subnet.public_1a subnet-066a64019a5c6d4d8
terraform import aws_subnet.public_1c subnet-028ca6b3fda1b8c0a
terraform import aws_subnet.private_1a subnet-003810fb3b283d928
terraform import aws_subnet.private_1c subnet-0df7ad8d4df193a94

# NAT Gateway
echo "Importing NAT Gateway..."
terraform import aws_nat_gateway.main nat-05ba4758d20958d6a

# Get Elastic IP allocation ID for NAT Gateway
NAT_EIP_ALLOC=$(aws ec2 describe-nat-gateways --nat-gateway-ids nat-05ba4758d20958d6a --region ap-northeast-1 --query 'NatGateways[0].NatGatewayAddresses[0].AllocationId' --output text)
echo "Importing Elastic IP (Allocation ID: $NAT_EIP_ALLOC)..."
terraform import aws_eip.nat $NAT_EIP_ALLOC

# Route Tables
echo "Getting Route Table IDs..."
PUBLIC_RT=$(aws ec2 describe-route-tables --filters "Name=vpc-id,Values=vpc-0a05f7ea441e4366a" "Name=tag:Name,Values=blog-aws-practice-public-rt" --region ap-northeast-1 --query 'RouteTables[0].RouteTableId' --output text)
PRIVATE_RT=$(aws ec2 describe-route-tables --filters "Name=vpc-id,Values=vpc-0a05f7ea441e4366a" --region ap-northeast-1 --query 'RouteTables[?Routes[?NatGatewayId!=`null`]].RouteTableId | [0]' --output text)

echo "Public Route Table: $PUBLIC_RT"
echo "Private Route Table: $PRIVATE_RT"

echo "Importing Route Tables..."
terraform import aws_route_table.public $PUBLIC_RT
terraform import aws_route_table.private $PRIVATE_RT

# Routes
echo "Importing Routes..."
terraform import aws_route.public_internet "${PUBLIC_RT}_0.0.0.0/0"
terraform import aws_route.private_nat "${PRIVATE_RT}_0.0.0.0/0"

# Route Table Associations
echo "Getting Route Table Association IDs..."
ASSOC_PUBLIC_1A=$(aws ec2 describe-route-tables --route-table-ids $PUBLIC_RT --region ap-northeast-1 --query 'RouteTables[0].Associations[?SubnetId==`subnet-066a64019a5c6d4d8`].RouteTableAssociationId | [0]' --output text)
ASSOC_PUBLIC_1C=$(aws ec2 describe-route-tables --route-table-ids $PUBLIC_RT --region ap-northeast-1 --query 'RouteTables[0].Associations[?SubnetId==`subnet-028ca6b3fda1b8c0a`].RouteTableAssociationId | [0]' --output text)
ASSOC_PRIVATE_1A=$(aws ec2 describe-route-tables --route-table-ids $PRIVATE_RT --region ap-northeast-1 --query 'RouteTables[0].Associations[?SubnetId==`subnet-003810fb3b283d928`].RouteTableAssociationId | [0]' --output text)
ASSOC_PRIVATE_1C=$(aws ec2 describe-route-tables --route-table-ids $PRIVATE_RT --region ap-northeast-1 --query 'RouteTables[0].Associations[?SubnetId==`subnet-0df7ad8d4df193a94`].RouteTableAssociationId | [0]' --output text)

echo "Importing Route Table Associations..."
terraform import aws_route_table_association.public_1a $ASSOC_PUBLIC_1A
terraform import aws_route_table_association.public_1c $ASSOC_PUBLIC_1C
terraform import aws_route_table_association.private_1a $ASSOC_PRIVATE_1A
terraform import aws_route_table_association.private_1c $ASSOC_PRIVATE_1C

# Security Groups
echo "Importing Security Groups..."
terraform import aws_security_group.alb sg-060b4afd240a33b2c
terraform import aws_security_group.ecs sg-0593f019c1e657f15
terraform import aws_security_group.rds sg-022c91dbd2a41e923

# Application Load Balancer
echo "Importing ALB..."
ALB_ARN="arn:aws:elasticloadbalancing:ap-northeast-1:664660631613:loadbalancer/app/blog-aws-practice-alb/773e6897de24593b"
terraform import aws_lb.main $ALB_ARN

# Target Group
echo "Getting Target Group ARN..."
TG_ARN=$(aws elbv2 describe-target-groups --region ap-northeast-1 --query 'TargetGroups[?TargetGroupName==`blog-aws-practice-tg`].TargetGroupArn | [0]' --output text)
if [ "$TG_ARN" == "None" ] || [ -z "$TG_ARN" ]; then
  echo "Target group not found, will be created by Terraform"
else
  echo "Importing Target Group..."
  terraform import aws_lb_target_group.app $TG_ARN
fi

# ALB Listener
echo "Getting Listener ARN..."
LISTENER_ARN=$(aws elbv2 describe-listeners --load-balancer-arn $ALB_ARN --region ap-northeast-1 --query 'Listeners[?Port==`80`].ListenerArn | [0]' --output text)
if [ "$LISTENER_ARN" != "None" ] && [ -n "$LISTENER_ARN" ]; then
  echo "Importing ALB Listener..."
  terraform import aws_lb_listener.http $LISTENER_ARN
fi

# ECS Cluster
echo "Importing ECS Cluster..."
terraform import aws_ecs_cluster.main blog-aws-practice-cluster

# RDS Subnet Group
echo "Checking RDS Subnet Group..."
DB_SUBNET_GROUP=$(aws rds describe-db-subnet-groups --db-subnet-group-name blog-aws-practice-db-subnet-group --region ap-northeast-1 2>/dev/null || echo "NOT_FOUND")
if [ "$DB_SUBNET_GROUP" != "NOT_FOUND" ]; then
  echo "Importing RDS Subnet Group..."
  terraform import aws_db_subnet_group.main blog-aws-practice-db-subnet-group
fi

# RDS Instance
echo "Importing RDS Instance..."
terraform import aws_db_instance.main blog-aws-practice-db

echo "Import complete! Run 'terraform plan' to verify the state."