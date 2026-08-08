terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region              = "sa-east-1"
  allowed_account_ids = ["261955339827"]
}

data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

locals {
  email_queue_name = "mundocolore-send-email"
  email_queue_url  = "https://sqs.${data.aws_region.current.name}.amazonaws.com/${data.aws_caller_identity.current.account_id}/${local.email_queue_name}"
  email_queue_arn  = "arn:aws:sqs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:${local.email_queue_name}"
}

# IAM Role for Lambda
resource "aws_iam_role" "lambda_role" {
  name = "lb_mundocolore-payments-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

# IAM Policy for DynamoDB access
resource "aws_iam_role_policy" "dynamodb_policy" {
  name = "lb_mundocolore-payments-dynamodb-policy"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:Scan",
          "dynamodb:UpdateItem"
        ]
        Resource = [
          "arn:aws:dynamodb:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:table/mundocolore-payments",
          "arn:aws:dynamodb:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:table/mundocolore-orders"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage"
        ]
        Resource = local.email_queue_arn
      }
    ]
  })
}

# Lambda Function
resource "aws_lambda_function" "payments_lambda" {
  function_name = "lb_mundocolore-payments"
  runtime       = "provided.al2023"
  handler       = "bootstrap"
  memory_size   = 128
  timeout       = 30

  filename         = "../lambda.zip"
  source_code_hash = filebase64sha256("../lambda.zip")

  role = aws_iam_role.lambda_role.arn

  environment {
    variables = {
      TABLE_NAME               = "mundocolore-payments"
      ORDERS_TABLE_NAME        = "mundocolore-orders"
      JWT_SECRET               = var.jwt_secret
      INFINITEPAY_HANDLE       = var.infinitepay_handle
      INFINITEPAY_API_URL      = var.infinitepay_api_url
      INFINITEPAY_REDIRECT_URL = var.infinitepay_redirect_url
      INFINITEPAY_WEBHOOK_URL  = var.infinitepay_webhook_url
      EMAIL_QUEUE_URL          = local.email_queue_url
    }
  }
}

# CloudWatch Logs
resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# API Gateway Integration
data "aws_api_gateway_rest_api" "gateway" {
  name = "mundocolore-gateway"
}

resource "aws_api_gateway_resource" "payments_resource" {
  rest_api_id = data.aws_api_gateway_rest_api.gateway.id
  parent_id   = data.aws_api_gateway_rest_api.gateway.root_resource_id
  path_part   = "payments"
}

resource "aws_api_gateway_method" "payments_post" {
  rest_api_id   = data.aws_api_gateway_rest_api.gateway.id
  resource_id   = aws_api_gateway_resource.payments_resource.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "payments_integration" {
  rest_api_id             = data.aws_api_gateway_rest_api.gateway.id
  resource_id             = aws_api_gateway_resource.payments_resource.id
  http_method             = aws_api_gateway_method.payments_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.payments_lambda.invoke_arn
}

resource "aws_api_gateway_resource" "payments_infinitepay_resource" {
  rest_api_id = data.aws_api_gateway_rest_api.gateway.id
  parent_id   = aws_api_gateway_resource.payments_resource.id
  path_part   = "infinitepay"
}

resource "aws_api_gateway_resource" "payments_infinitepay_proxy_resource" {
  rest_api_id = data.aws_api_gateway_rest_api.gateway.id
  parent_id   = aws_api_gateway_resource.payments_infinitepay_resource.id
  path_part   = "{proxy+}"
}

resource "aws_api_gateway_method" "payments_infinitepay_any" {
  rest_api_id   = data.aws_api_gateway_rest_api.gateway.id
  resource_id   = aws_api_gateway_resource.payments_infinitepay_resource.id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_method" "payments_infinitepay_proxy_any" {
  rest_api_id   = data.aws_api_gateway_rest_api.gateway.id
  resource_id   = aws_api_gateway_resource.payments_infinitepay_proxy_resource.id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "payments_infinitepay_any_integration" {
  rest_api_id             = data.aws_api_gateway_rest_api.gateway.id
  resource_id             = aws_api_gateway_resource.payments_infinitepay_resource.id
  http_method             = aws_api_gateway_method.payments_infinitepay_any.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.payments_lambda.invoke_arn
}

resource "aws_api_gateway_integration" "payments_infinitepay_proxy_any_integration" {
  rest_api_id             = data.aws_api_gateway_rest_api.gateway.id
  resource_id             = aws_api_gateway_resource.payments_infinitepay_proxy_resource.id
  http_method             = aws_api_gateway_method.payments_infinitepay_proxy_any.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.payments_lambda.invoke_arn
}

resource "aws_api_gateway_resource" "webhook_resource" {
  rest_api_id = data.aws_api_gateway_rest_api.gateway.id
  parent_id   = data.aws_api_gateway_rest_api.gateway.root_resource_id
  path_part   = "webhook"
}

resource "aws_api_gateway_resource" "webhook_infinitepay_resource" {
  rest_api_id = data.aws_api_gateway_rest_api.gateway.id
  parent_id   = aws_api_gateway_resource.webhook_resource.id
  path_part   = "infinitepay"
}

resource "aws_api_gateway_method" "webhook_infinitepay_post" {
  rest_api_id   = data.aws_api_gateway_rest_api.gateway.id
  resource_id   = aws_api_gateway_resource.webhook_infinitepay_resource.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "webhook_infinitepay_post_integration" {
  rest_api_id             = data.aws_api_gateway_rest_api.gateway.id
  resource_id             = aws_api_gateway_resource.webhook_infinitepay_resource.id
  http_method             = aws_api_gateway_method.webhook_infinitepay_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.payments_lambda.invoke_arn
}

resource "aws_api_gateway_resource" "payments_health_resource" {
  rest_api_id = data.aws_api_gateway_rest_api.gateway.id
  parent_id   = aws_api_gateway_resource.payments_resource.id
  path_part   = "health"
}

resource "aws_api_gateway_resource" "payments_health_online_resource" {
  rest_api_id = data.aws_api_gateway_rest_api.gateway.id
  parent_id   = aws_api_gateway_resource.payments_health_resource.id
  path_part   = "online"
}

resource "aws_api_gateway_resource" "payments_health_data_resource" {
  rest_api_id = data.aws_api_gateway_rest_api.gateway.id
  parent_id   = aws_api_gateway_resource.payments_health_resource.id
  path_part   = "data"
}

resource "aws_api_gateway_method" "payments_health_online_get" {
  rest_api_id   = data.aws_api_gateway_rest_api.gateway.id
  resource_id   = aws_api_gateway_resource.payments_health_online_resource.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "payments_health_online_get_integration" {
  rest_api_id             = data.aws_api_gateway_rest_api.gateway.id
  resource_id             = aws_api_gateway_resource.payments_health_online_resource.id
  http_method             = aws_api_gateway_method.payments_health_online_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.payments_lambda.invoke_arn
}

resource "aws_api_gateway_method" "payments_health_data_get" {
  rest_api_id   = data.aws_api_gateway_rest_api.gateway.id
  resource_id   = aws_api_gateway_resource.payments_health_data_resource.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "payments_health_data_get_integration" {
  rest_api_id             = data.aws_api_gateway_rest_api.gateway.id
  resource_id             = aws_api_gateway_resource.payments_health_data_resource.id
  http_method             = aws_api_gateway_method.payments_health_data_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.payments_lambda.invoke_arn
}

# Lambda permission
resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.payments_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${data.aws_api_gateway_rest_api.gateway.execution_arn}/*/*/*"
}
