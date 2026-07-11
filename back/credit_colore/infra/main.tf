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
data "aws_api_gateway_rest_api" "gateway" { name = "mundocolore-gateway" }

resource "aws_iam_role" "lambda_role" {
  name = "lb_mundocolore-credit-colore-role"
  assume_role_policy = jsonencode({
    Version   = "2012-10-17"
    Statement = [{ Action = "sts:AssumeRole", Effect = "Allow", Principal = { Service = "lambda.amazonaws.com" } }]
  })
}

resource "aws_iam_role_policy" "dynamodb_policy" {
  name = "lb_mundocolore-credit-colore-dynamodb-policy"
  role = aws_iam_role.lambda_role.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem", "dynamodb:Scan", "dynamodb:Query"]
      Resource = [
        "arn:aws:dynamodb:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:table/mundocolore-credit",
        "arn:aws:dynamodb:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:table/mundocolore-users",
        "arn:aws:dynamodb:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:table/mundocolore-role"
      ]
    }]
  })
}

resource "aws_lambda_function" "credit_colore_lambda" {
  function_name    = "lb_mundocolore-credit-colore"
  runtime          = "provided.al2023"
  handler          = "bootstrap"
  memory_size      = 128
  timeout          = 30
  filename         = "../lambda.zip"
  source_code_hash = fileexists("../lambda.zip") ? filebase64sha256("../lambda.zip") : null
  role             = aws_iam_role.lambda_role.arn
  environment {
    variables = {
      TABLE_NAME       = "mundocolore-credit"
      USERS_TABLE_NAME = "mundocolore-users"
      ROLE_TABLE_NAME  = "mundocolore-role"
      JWT_SECRET       = var.jwt_secret
    }
  }
}

resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_api_gateway_resource" "credit_resource" {
  rest_api_id = data.aws_api_gateway_rest_api.gateway.id
  parent_id   = data.aws_api_gateway_rest_api.gateway.root_resource_id
  path_part   = "credit-colore"
}

resource "aws_api_gateway_resource" "credit_proxy_resource" {
  rest_api_id = data.aws_api_gateway_rest_api.gateway.id
  parent_id   = aws_api_gateway_resource.credit_resource.id
  path_part   = "{proxy+}"
}

resource "aws_api_gateway_method" "credit_any" {
  rest_api_id   = data.aws_api_gateway_rest_api.gateway.id
  resource_id   = aws_api_gateway_resource.credit_resource.id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_method" "credit_proxy_any" {
  rest_api_id   = data.aws_api_gateway_rest_api.gateway.id
  resource_id   = aws_api_gateway_resource.credit_proxy_resource.id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "credit_any" {
  rest_api_id             = data.aws_api_gateway_rest_api.gateway.id
  resource_id             = aws_api_gateway_resource.credit_resource.id
  http_method             = aws_api_gateway_method.credit_any.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.credit_colore_lambda.invoke_arn
}

resource "aws_api_gateway_integration" "credit_proxy_any" {
  rest_api_id             = data.aws_api_gateway_rest_api.gateway.id
  resource_id             = aws_api_gateway_resource.credit_proxy_resource.id
  http_method             = aws_api_gateway_method.credit_proxy_any.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.credit_colore_lambda.invoke_arn
}

resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.credit_colore_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${data.aws_api_gateway_rest_api.gateway.execution_arn}/*/*/*"
}
