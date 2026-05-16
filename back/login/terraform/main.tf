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

resource "aws_iam_role" "lambda_role" {
  name = "lb_mundocolore-login-role"

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

resource "aws_iam_role_policy" "dynamodb_policy" {
  name = "lb_mundocolore-login-dynamodb-policy"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:Scan",
          "dynamodb:Query"
        ]
        Resource = [
          "arn:aws:dynamodb:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:table/mundocolore-users",
          "arn:aws:dynamodb:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:table/mundocolore-users/index/*"
        ]
      }
    ]
  })
}

resource "aws_lambda_function" "login_lambda" {
  function_name = "lb_mundocolore-login"
  runtime       = "provided.al2023"
  handler       = "bootstrap"
  memory_size   = 128
  timeout       = 30

  filename         = "../lambda.zip"
  source_code_hash = filebase64sha256("../lambda.zip")

  role = aws_iam_role.lambda_role.arn

  environment {
    variables = {
      TABLE_NAME       = "mundocolore-users"
      JWT_SECRET       = var.jwt_secret
      LOGIN_BASIC_AUTH = var.login_basic_auth
    }
  }
}

resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

data "aws_api_gateway_rest_api" "gateway" {
  name = "mundocolore-gateway"
}

resource "aws_api_gateway_resource" "login_resource" {
  rest_api_id = data.aws_api_gateway_rest_api.gateway.id
  parent_id   = data.aws_api_gateway_rest_api.gateway.root_resource_id
  path_part   = "login"
}

resource "aws_api_gateway_method" "login_post" {
  rest_api_id   = data.aws_api_gateway_rest_api.gateway.id
  resource_id   = aws_api_gateway_resource.login_resource.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "login_post_integration" {
  rest_api_id             = data.aws_api_gateway_rest_api.gateway.id
  resource_id             = aws_api_gateway_resource.login_resource.id
  http_method             = aws_api_gateway_method.login_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.login_lambda.invoke_arn
}

resource "aws_api_gateway_resource" "health_resource" {
  rest_api_id = data.aws_api_gateway_rest_api.gateway.id
  parent_id   = aws_api_gateway_resource.login_resource.id
  path_part   = "health"
}

resource "aws_api_gateway_resource" "health_online_resource" {
  rest_api_id = data.aws_api_gateway_rest_api.gateway.id
  parent_id   = aws_api_gateway_resource.health_resource.id
  path_part   = "online"
}

resource "aws_api_gateway_resource" "health_data_resource" {
  rest_api_id = data.aws_api_gateway_rest_api.gateway.id
  parent_id   = aws_api_gateway_resource.health_resource.id
  path_part   = "data"
}

resource "aws_api_gateway_method" "health_online_get" {
  rest_api_id   = data.aws_api_gateway_rest_api.gateway.id
  resource_id   = aws_api_gateway_resource.health_online_resource.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "health_online_get_integration" {
  rest_api_id             = data.aws_api_gateway_rest_api.gateway.id
  resource_id             = aws_api_gateway_resource.health_online_resource.id
  http_method             = aws_api_gateway_method.health_online_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.login_lambda.invoke_arn
}

resource "aws_api_gateway_method" "health_data_get" {
  rest_api_id   = data.aws_api_gateway_rest_api.gateway.id
  resource_id   = aws_api_gateway_resource.health_data_resource.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "health_data_get_integration" {
  rest_api_id             = data.aws_api_gateway_rest_api.gateway.id
  resource_id             = aws_api_gateway_resource.health_data_resource.id
  http_method             = aws_api_gateway_method.health_data_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.login_lambda.invoke_arn
}

resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.login_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${data.aws_api_gateway_rest_api.gateway.execution_arn}/*/*/*"
}

locals {
  login_cors_resources = {
    login               = aws_api_gateway_resource.login_resource.id
    login_health_online = aws_api_gateway_resource.health_online_resource.id
    login_health_data   = aws_api_gateway_resource.health_data_resource.id
  }
}

resource "aws_api_gateway_method" "login_options" {
  for_each      = local.login_cors_resources
  rest_api_id   = data.aws_api_gateway_rest_api.gateway.id
  resource_id   = each.value
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "login_options" {
  for_each    = local.login_cors_resources
  rest_api_id = data.aws_api_gateway_rest_api.gateway.id
  resource_id = each.value
  http_method = aws_api_gateway_method.login_options[each.key].http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "login_options_200" {
  for_each    = local.login_cors_resources
  rest_api_id = data.aws_api_gateway_rest_api.gateway.id
  resource_id = each.value
  http_method = aws_api_gateway_method.login_options[each.key].http_method
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

resource "aws_api_gateway_integration_response" "login_options_200" {
  for_each    = local.login_cors_resources
  rest_api_id = data.aws_api_gateway_rest_api.gateway.id
  resource_id = each.value
  http_method = aws_api_gateway_method.login_options[each.key].http_method
  status_code = aws_api_gateway_method_response.login_options_200[each.key].status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'${local.cors_allow_headers}'"
    "method.response.header.Access-Control-Allow-Methods" = "'${local.cors_allow_methods}'"
    "method.response.header.Access-Control-Allow-Origin"  = "'${local.cors_allow_origin}'"
  }
}
