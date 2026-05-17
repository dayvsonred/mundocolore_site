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
  cors_allow_headers = "Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token"
  cors_allow_methods = "GET,POST,PUT,PATCH,DELETE,OPTIONS"
  cors_allow_origin  = "*"
}

# IAM Role for Lambda
resource "aws_iam_role" "lambda_role" {
  name = "lb_mundocolore-addresses-role"

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
  name = "lb_mundocolore-addresses-dynamodb-policy"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [
          "arn:aws:dynamodb:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:table/mundocolore-addresses"
        ]
      }
    ]
  })
}

# Lambda Function
resource "aws_lambda_function" "addresses_lambda" {
  function_name = "lb_mundocolore-addresses"
  runtime       = "provided.al2023"
  handler       = "bootstrap"
  memory_size   = 128
  timeout       = 30

  filename         = "../lambda.zip"
  source_code_hash = filebase64sha256("../lambda.zip")

  role = aws_iam_role.lambda_role.arn

  environment {
    variables = {
      TABLE_NAME = "mundocolore-addresses"
      JWT_SECRET = var.jwt_secret
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

resource "aws_api_gateway_resource" "addresses_resource" {
  rest_api_id = data.aws_api_gateway_rest_api.gateway.id
  parent_id   = data.aws_api_gateway_rest_api.gateway.root_resource_id
  path_part   = "addresses"
}

resource "aws_api_gateway_method" "addresses_post" {
  rest_api_id   = data.aws_api_gateway_rest_api.gateway.id
  resource_id   = aws_api_gateway_resource.addresses_resource.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "addresses_integration" {
  rest_api_id             = data.aws_api_gateway_rest_api.gateway.id
  resource_id             = aws_api_gateway_resource.addresses_resource.id
  http_method             = aws_api_gateway_method.addresses_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.addresses_lambda.invoke_arn
}

resource "aws_api_gateway_method" "addresses_get" {
  rest_api_id   = data.aws_api_gateway_rest_api.gateway.id
  resource_id   = aws_api_gateway_resource.addresses_resource.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "addresses_get_integration" {
  rest_api_id             = data.aws_api_gateway_rest_api.gateway.id
  resource_id             = aws_api_gateway_resource.addresses_resource.id
  http_method             = aws_api_gateway_method.addresses_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.addresses_lambda.invoke_arn
}

resource "aws_api_gateway_method" "addresses_put" {
  rest_api_id   = data.aws_api_gateway_rest_api.gateway.id
  resource_id   = aws_api_gateway_resource.addresses_resource.id
  http_method   = "PUT"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "addresses_put_integration" {
  rest_api_id             = data.aws_api_gateway_rest_api.gateway.id
  resource_id             = aws_api_gateway_resource.addresses_resource.id
  http_method             = aws_api_gateway_method.addresses_put.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.addresses_lambda.invoke_arn
}

resource "aws_api_gateway_method" "addresses_delete" {
  rest_api_id   = data.aws_api_gateway_rest_api.gateway.id
  resource_id   = aws_api_gateway_resource.addresses_resource.id
  http_method   = "DELETE"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "addresses_delete_integration" {
  rest_api_id             = data.aws_api_gateway_rest_api.gateway.id
  resource_id             = aws_api_gateway_resource.addresses_resource.id
  http_method             = aws_api_gateway_method.addresses_delete.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.addresses_lambda.invoke_arn
}

resource "aws_api_gateway_resource" "addresses_health_resource" {
  rest_api_id = data.aws_api_gateway_rest_api.gateway.id
  parent_id   = aws_api_gateway_resource.addresses_resource.id
  path_part   = "health"
}

resource "aws_api_gateway_resource" "addresses_health_online_resource" {
  rest_api_id = data.aws_api_gateway_rest_api.gateway.id
  parent_id   = aws_api_gateway_resource.addresses_health_resource.id
  path_part   = "online"
}

resource "aws_api_gateway_resource" "addresses_health_data_resource" {
  rest_api_id = data.aws_api_gateway_rest_api.gateway.id
  parent_id   = aws_api_gateway_resource.addresses_health_resource.id
  path_part   = "data"
}

resource "aws_api_gateway_method" "addresses_health_online_get" {
  rest_api_id   = data.aws_api_gateway_rest_api.gateway.id
  resource_id   = aws_api_gateway_resource.addresses_health_online_resource.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "addresses_health_online_get_integration" {
  rest_api_id             = data.aws_api_gateway_rest_api.gateway.id
  resource_id             = aws_api_gateway_resource.addresses_health_online_resource.id
  http_method             = aws_api_gateway_method.addresses_health_online_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.addresses_lambda.invoke_arn
}

resource "aws_api_gateway_method" "addresses_health_data_get" {
  rest_api_id   = data.aws_api_gateway_rest_api.gateway.id
  resource_id   = aws_api_gateway_resource.addresses_health_data_resource.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "addresses_health_data_get_integration" {
  rest_api_id             = data.aws_api_gateway_rest_api.gateway.id
  resource_id             = aws_api_gateway_resource.addresses_health_data_resource.id
  http_method             = aws_api_gateway_method.addresses_health_data_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.addresses_lambda.invoke_arn
}

# Lambda permission
resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.addresses_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${data.aws_api_gateway_rest_api.gateway.execution_arn}/*/*/*"
}

locals {
  addresses_cors_resources = {
    addresses               = aws_api_gateway_resource.addresses_resource.id
    addresses_health_online = aws_api_gateway_resource.addresses_health_online_resource.id
    addresses_health_data   = aws_api_gateway_resource.addresses_health_data_resource.id
  }
}

resource "aws_api_gateway_method" "addresses_options" {
  for_each      = local.addresses_cors_resources
  rest_api_id   = data.aws_api_gateway_rest_api.gateway.id
  resource_id   = each.value
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "addresses_options" {
  for_each    = local.addresses_cors_resources
  rest_api_id = data.aws_api_gateway_rest_api.gateway.id
  resource_id = each.value
  http_method = aws_api_gateway_method.addresses_options[each.key].http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "addresses_options_200" {
  for_each    = local.addresses_cors_resources
  rest_api_id = data.aws_api_gateway_rest_api.gateway.id
  resource_id = each.value
  http_method = aws_api_gateway_method.addresses_options[each.key].http_method
  status_code = "200"

  response_models = {
    "application/json" = "Empty"
  }

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "addresses_options_200" {
  for_each    = local.addresses_cors_resources
  rest_api_id = data.aws_api_gateway_rest_api.gateway.id
  resource_id = each.value
  http_method = aws_api_gateway_method.addresses_options[each.key].http_method
  status_code = aws_api_gateway_method_response.addresses_options_200[each.key].status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'${local.cors_allow_headers}'"
    "method.response.header.Access-Control-Allow-Methods" = "'${local.cors_allow_methods}'"
    "method.response.header.Access-Control-Allow-Origin"  = "'${local.cors_allow_origin}'"
  }
}
