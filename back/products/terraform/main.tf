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

# IAM Role for Lambda
resource "aws_iam_role" "lambda_role" {
  name = "lb_mundocolore-products-role"

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
  name = "lb_mundocolore-products-dynamodb-policy"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:Scan",
          "dynamodb:PutItem"
        ]
        Resource = [
          "arn:aws:dynamodb:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:table/mundocolore-products"
        ]
      }
    ]
  })
}

# Lambda Function
resource "aws_lambda_function" "products_lambda" {
  function_name = "lb_mundocolore-products"
  runtime       = "provided.al2023"
  handler       = "bootstrap"
  memory_size   = 128
  timeout       = 30

  filename         = "../lambda.zip"
  source_code_hash = filebase64sha256("../lambda.zip")

  role = aws_iam_role.lambda_role.arn

  environment {
    variables = {
      TABLE_NAME = "mundocolore-products"
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

resource "aws_api_gateway_resource" "products_resource" {
  rest_api_id = data.aws_api_gateway_rest_api.gateway.id
  parent_id   = data.aws_api_gateway_rest_api.gateway.root_resource_id
  path_part   = "products"
}

resource "aws_api_gateway_method" "products_post" {
  rest_api_id   = data.aws_api_gateway_rest_api.gateway.id
  resource_id   = aws_api_gateway_resource.products_resource.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "products_integration" {
  rest_api_id             = data.aws_api_gateway_rest_api.gateway.id
  resource_id             = aws_api_gateway_resource.products_resource.id
  http_method             = aws_api_gateway_method.products_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.products_lambda.invoke_arn
}

resource "aws_api_gateway_method" "products_get" {
  rest_api_id   = data.aws_api_gateway_rest_api.gateway.id
  resource_id   = aws_api_gateway_resource.products_resource.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "products_get_integration" {
  rest_api_id             = data.aws_api_gateway_rest_api.gateway.id
  resource_id             = aws_api_gateway_resource.products_resource.id
  http_method             = aws_api_gateway_method.products_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.products_lambda.invoke_arn
}

resource "aws_api_gateway_resource" "products_health_resource" {
  rest_api_id = data.aws_api_gateway_rest_api.gateway.id
  parent_id   = aws_api_gateway_resource.products_resource.id
  path_part   = "health"
}

resource "aws_api_gateway_resource" "products_health_online_resource" {
  rest_api_id = data.aws_api_gateway_rest_api.gateway.id
  parent_id   = aws_api_gateway_resource.products_health_resource.id
  path_part   = "online"
}

resource "aws_api_gateway_resource" "products_health_data_resource" {
  rest_api_id = data.aws_api_gateway_rest_api.gateway.id
  parent_id   = aws_api_gateway_resource.products_health_resource.id
  path_part   = "data"
}

resource "aws_api_gateway_method" "products_health_online_get" {
  rest_api_id   = data.aws_api_gateway_rest_api.gateway.id
  resource_id   = aws_api_gateway_resource.products_health_online_resource.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "products_health_online_get_integration" {
  rest_api_id             = data.aws_api_gateway_rest_api.gateway.id
  resource_id             = aws_api_gateway_resource.products_health_online_resource.id
  http_method             = aws_api_gateway_method.products_health_online_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.products_lambda.invoke_arn
}

resource "aws_api_gateway_method" "products_health_data_get" {
  rest_api_id   = data.aws_api_gateway_rest_api.gateway.id
  resource_id   = aws_api_gateway_resource.products_health_data_resource.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "products_health_data_get_integration" {
  rest_api_id             = data.aws_api_gateway_rest_api.gateway.id
  resource_id             = aws_api_gateway_resource.products_health_data_resource.id
  http_method             = aws_api_gateway_method.products_health_data_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.products_lambda.invoke_arn
}

# Lambda permission
resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.products_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${data.aws_api_gateway_rest_api.gateway.execution_arn}/*/*/*"
}
