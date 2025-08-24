terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}

provider "aws" {
  region = "ap-northeast-1"
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = false
  enable_dns_support   = true

  tags = {
    Name = "blog-aws-practice-vpc"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "blog-aws-practice-igw"
  }
}

# Elastic IP for NAT Gateway
resource "aws_eip" "nat" {
  domain = "vpc"

  tags = {}
}

# NAT Gateway
resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public_1a.id

  tags = {
    Name = "blog-aws-practice-nat"
  }

  depends_on = [aws_internet_gateway.main]
}

# Subnets
resource "aws_subnet" "public_1a" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "ap-northeast-1a"
  map_public_ip_on_launch = false

  tags = {
    Name = "blog-aws-practice-public-1a"
  }
}

resource "aws_subnet" "public_1c" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = "ap-northeast-1c"
  map_public_ip_on_launch = false

  tags = {
    Name = "blog-aws-practice-public-1c"
  }
}

resource "aws_subnet" "private_1a" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.11.0/24"
  availability_zone = "ap-northeast-1a"

  tags = {
    Name = "blog-aws-practice-private-1a"
  }
}

resource "aws_subnet" "private_1c" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.12.0/24"
  availability_zone = "ap-northeast-1c"

  tags = {
    Name = "blog-aws-practice-private-1c"
  }
}

# Route Tables
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "blog-aws-practice-public-rt"
  }
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  tags = {}
}

# Routes
resource "aws_route" "public_internet" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.main.id
}

resource "aws_route" "private_nat" {
  route_table_id         = aws_route_table.private.id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.main.id
}

# Route Table Associations
resource "aws_route_table_association" "public_1a" {
  subnet_id      = aws_subnet.public_1a.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "public_1c" {
  subnet_id      = aws_subnet.public_1c.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private_1a" {
  subnet_id      = aws_subnet.private_1a.id
  route_table_id = aws_route_table.private.id
}

resource "aws_route_table_association" "private_1c" {
  subnet_id      = aws_subnet.private_1c.id
  route_table_id = aws_route_table.private.id
}

# Security Groups
resource "aws_security_group" "alb" {
  name        = "blog-aws-practice-alb-sg"
  description = "Security group for ALB"
  vpc_id      = aws_vpc.main.id

  # Cloudflare IPs only for port 80
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = [
      "173.245.48.0/20",
      "103.21.244.0/22",
      "103.22.200.0/22",
      "103.31.4.0/22",
      "141.101.64.0/18",
      "108.162.192.0/18",
      "190.93.240.0/20",
      "188.114.96.0/20",
      "197.234.240.0/22",
      "198.41.128.0/17",
      "162.158.0.0/15",
      "104.16.0.0/13",
      "104.24.0.0/14",
      "172.64.0.0/13",
      "131.0.72.0/22"
    ]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {}
}

resource "aws_security_group" "ecs" {
  name        = "blog-aws-practice-ecs-sg"
  description = "Security group for ECS tasks"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 4000
    to_port         = 4000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {}
}

resource "aws_security_group" "rds" {
  name        = "blog-aws-practice-rds-sg"
  description = "Security group for RDS database"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {}
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "blog-aws-practice-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = [aws_subnet.public_1a.id, aws_subnet.public_1c.id]

  enable_deletion_protection = false
  enable_http2              = true

  tags = {}
}

# ALB Target Group
resource "aws_lb_target_group" "app" {
  name        = "blog-aws-practice-tg"
  port        = 4000
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 30
    interval            = 60
    path                = "/health"
    matcher             = "200"
  }

  deregistration_delay = 300

  stickiness {
    type            = "lb_cookie"
    cookie_duration = 86400
    enabled         = false
  }

  tags = {}
}

# ALB Listener
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "blog-aws-practice-cluster"

  setting {
    name  = "containerInsights"
    value = "disabled"
  }

  tags = {}
}

# RDS Subnet Group
resource "aws_db_subnet_group" "main" {
  name        = "blog-aws-practice-db-subnet-group"
  subnet_ids  = [aws_subnet.private_1a.id, aws_subnet.private_1c.id]
  description = "Subnet group for blog-aws-practice database"

  tags = {}
}

# RDS Instance
resource "aws_db_instance" "main" {
  identifier     = "blog-aws-practice-db"
  engine         = "postgres"
  engine_version = "17.4"
  instance_class = "db.t4g.micro"
  
  allocated_storage     = 20
  storage_type         = "gp2"
  storage_encrypted    = true
  kms_key_id          = "arn:aws:kms:ap-northeast-1:664660631613:key/109f4f17-c928-4a2c-8b5c-fc1e047285d4"
  
  db_name  = "blog_aws_practice"
  username = "postgres"
  password = "postgres"
  
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  
  skip_final_snapshot     = true
  deletion_protection     = false
  copy_tags_to_snapshot   = true
  
  backup_retention_period = 1
  backup_window          = "18:49-19:19"
  maintenance_window     = "thu:16:32-thu:17:02"
  
  auto_minor_version_upgrade = true
  
  performance_insights_enabled          = true
  performance_insights_kms_key_id       = "arn:aws:kms:ap-northeast-1:664660631613:key/109f4f17-c928-4a2c-8b5c-fc1e047285d4"
  performance_insights_retention_period = 7
  
  tags = {}
  
  lifecycle {
    ignore_changes = [password]
  }
}

# IAM Roles for ECS
data "aws_iam_policy_document" "ecs_task_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "ecs_task_execution" {
  name               = "blog-aws-practice-ecs-task-execution-role"
  description        = "Allows ECS tasks to call AWS services on your behalf."
  assume_role_policy = data.aws_iam_policy_document.ecs_task_assume_role.json

  tags = {}
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution_policy" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution_secrets" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/SecretsManagerReadWrite"
}

resource "aws_iam_role" "ecs_task" {
  name               = "blog-aws-practice-ecs-task-role"
  description        = "Allows ECS tasks to call AWS services on your behalf."
  assume_role_policy = data.aws_iam_policy_document.ecs_task_assume_role.json

  tags = {}
}

resource "aws_iam_policy" "ecs_exec" {
  name        = "blog-aws-practice-ecs-exec-policy"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ssmmessages:CreateControlChannel",
          "ssmmessages:CreateDataChannel",
          "ssmmessages:OpenControlChannel",
          "ssmmessages:OpenDataChannel"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:DescribeLogGroups",
          "logs:CreateLogStream",
          "logs:DescribeLogStreams",
          "logs:PutLogEvents"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_task_exec_policy" {
  role       = aws_iam_role.ecs_task.name
  policy_arn = "arn:aws:iam::664660631613:policy/blog-aws-practice-ecs-exec-policy"
}

# ECR Repositories
resource "aws_ecr_repository" "server" {
  name                 = "blog-aws-practice-server"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = false
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = {}
}

resource "aws_ecr_repository" "bastion" {
  name                 = "blog-aws-practice-bastion"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = false
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = {}
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "ecs_server" {
  name              = "/ecs/blog-aws-practice"
  retention_in_days = 0

  tags = {}
}

resource "aws_cloudwatch_log_group" "ecs_bastion" {
  name              = "/ecs/blog-aws-practice-bastion"
  retention_in_days = 0

  tags = {}
}

# Secrets Manager
resource "aws_secretsmanager_secret" "rds" {
  name                    = "blog-aws-practice/rds"
  description             = "RDS PostgreSQL credentials for blog-aws-practice"
  recovery_window_in_days = 0
  
  tags = {}
}

resource "aws_secretsmanager_secret" "supabase" {
  name                    = "blog-aws-practice/supabase"
  recovery_window_in_days = 0
  
  tags = {}
}

resource "aws_secretsmanager_secret" "database_url" {
  name                    = "blog-aws-practice/database-url"
  description             = "PostgreSQL connection string for ECS"
  recovery_window_in_days = 0
  
  tags = {}
}

# ECS Task Definitions
resource "aws_ecs_task_definition" "server" {
  family                   = "blog-aws-practice-task"
  network_mode            = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                     = "256"
  memory                  = "512"
  execution_role_arn      = aws_iam_role.ecs_task_execution.arn

  container_definitions = jsonencode([{
    name  = "blog-aws-practice-server"
    image = "${aws_ecr_repository.server.repository_url}:630020484c0400595ceb769482c7fe5f64bfba63"
    
    portMappings = [{
      containerPort = 4000
      hostPort      = 4000
      protocol      = "tcp"
    }]
    
    environment = [
      { name = "NODE_ENV", value = "production" },
      { name = "PORT", value = "4000" },
      { name = "GRAPHQL_INTROSPECTION", value = "false" },
      { name = "CORS_ORIGIN", value = "https://blog-aws-practice-frontend.mrcdsamg63.workers.dev" },
      { name = "GRAPHQL_PLAYGROUND", value = "false" }
    ]
    
    secrets = [
      {
        name      = "DATABASE_URL"
        valueFrom = "arn:aws:secretsmanager:ap-northeast-1:664660631613:secret:blog-aws-practice/database-url:DATABASE_URL::"
      },
      {
        name      = "SUPABASE_URL"
        valueFrom = "arn:aws:secretsmanager:ap-northeast-1:664660631613:secret:blog-aws-practice/supabase:SUPABASE_URL::"
      },
      {
        name      = "SUPABASE_ANON_KEY"
        valueFrom = "arn:aws:secretsmanager:ap-northeast-1:664660631613:secret:blog-aws-practice/supabase:SUPABASE_ANON_KEY::"
      },
      {
        name      = "SUPABASE_JWT_SECRET"
        valueFrom = "arn:aws:secretsmanager:ap-northeast-1:664660631613:secret:blog-aws-practice/supabase:SUPABASE_JWT_SECRET::"
      }
    ]
    
    healthCheck = {
      command     = ["CMD-SHELL", "curl -f http://localhost:4000/health || exit 1"]
      interval    = 30
      retries     = 3
      startPeriod = 60
      timeout     = 5
    }
    
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.ecs_server.name
        "awslogs-region"        = "ap-northeast-1"
        "awslogs-stream-prefix" = "ecs"
      }
    }
    
    essential = true
    mountPoints = []
    volumesFrom = []
    systemControls = []
  }])
  
  tags = {}
}

resource "aws_ecs_task_definition" "bastion" {
  family                   = "blog-aws-practice-bastion-task"
  network_mode            = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                     = "256"
  memory                  = "512"
  execution_role_arn      = aws_iam_role.ecs_task_execution.arn
  task_role_arn           = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([{
    name  = "bastion"
    image = "${aws_ecr_repository.bastion.repository_url}:latest"
    
    secrets = [{
      name      = "DATABASE_URL"
      valueFrom = "arn:aws:secretsmanager:ap-northeast-1:664660631613:secret:blog-aws-practice/database-url:DATABASE_URL::"
    }]
    
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.ecs_bastion.name
        "awslogs-region"        = "ap-northeast-1"
        "awslogs-stream-prefix" = "bastion"
      }
    }
    
    essential = true
    environment = []
    mountPoints = []
    portMappings = []
    volumesFrom = []
    systemControls = []
  }])
  
  tags = {}
}

# ECS Services
resource "aws_ecs_service" "server" {
  name                    = "blog-aws-practice-server"
  cluster                 = aws_ecs_cluster.main.id
  task_definition         = aws_ecs_task_definition.server.arn
  desired_count           = 1
  launch_type             = "FARGATE"
  enable_ecs_managed_tags = true

  network_configuration {
    subnets          = [aws_subnet.private_1a.id, aws_subnet.private_1c.id]
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.app.arn
    container_name   = "blog-aws-practice-server"
    container_port   = 4000
  }

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  depends_on = [aws_lb_listener.http]
  
  tags = {}
  
  lifecycle {
    ignore_changes = [task_definition, availability_zone_rebalancing]
  }
}

resource "aws_ecs_service" "bastion" {
  name                   = "blog-aws-practice-bastion"
  cluster                = aws_ecs_cluster.main.id
  task_definition        = aws_ecs_task_definition.bastion.arn
  desired_count          = 0
  launch_type            = "FARGATE"
  enable_execute_command = true

  network_configuration {
    subnets          = [aws_subnet.private_1a.id, aws_subnet.private_1c.id]
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = false
  }
  
  tags = {}
  
  lifecycle {
    ignore_changes = [task_definition]
  }
}