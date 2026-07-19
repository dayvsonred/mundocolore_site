terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region              = var.aws_region
  allowed_account_ids = [var.aws_account_id]
}

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
data "aws_api_gateway_rest_api" "gateway" { name = "mundocolore-gateway" }
data "aws_sqs_queue" "email_queue" { name = var.email_queue_name }

resource "aws_iam_role" "lambda_role" {
  name = "lb_mundocolore-email-mailbox-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole", Effect = "Allow", Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy" "lambda_policy" {
  name = "lb_mundocolore-email-mailbox-policy"
  role = aws_iam_role.lambda_role.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = ["dynamodb:GetItem", "dynamodb:Query", "dynamodb:UpdateItem"]
        Resource = [
          "arn:aws:dynamodb:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:table/${var.email_table_name}",
          "arn:aws:dynamodb:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:table/${var.email_table_name}/index/${var.mailbox_index_name}",
          "arn:aws:dynamodb:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:table/${var.role_table_name}"
        ]
      },
      {
        Effect   = "Allow"
        Action   = ["s3:GetObject"]
        Resource = "arn:aws:s3:::${var.bucket_name}/*"
      },
      {
        Effect   = "Allow"
        Action   = ["sqs:SendMessage"]
        Resource = data.aws_sqs_queue.email_queue.arn
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_lambda_function" "email_mailbox" {
  function_name    = "lb_mundocolore-email-mailbox"
  runtime          = "provided.al2023"
  handler          = "bootstrap"
  memory_size      = 256
  timeout          = 30
  filename         = "../lambda.zip"
  source_code_hash = fileexists("../lambda.zip") ? filebase64sha256("../lambda.zip") : null
  role             = aws_iam_role.lambda_role.arn

  environment {
    variables = {
      TABLE_NAME        = var.email_table_name
      MAILBOX_INDEX     = var.mailbox_index_name
      ROLE_TABLE_NAME   = var.role_table_name
      BUCKET_NAME       = var.bucket_name
      EMAIL_QUEUE_URL   = data.aws_sqs_queue.email_queue.url
      ALLOWED_MAILBOXES = var.allowed_mailboxes
      JWT_SECRET        = var.jwt_secret
    }
  }
}

resource "aws_api_gateway_resource" "emails" {
  rest_api_id = data.aws_api_gateway_rest_api.gateway.id
  parent_id   = data.aws_api_gateway_rest_api.gateway.root_resource_id
  path_part   = "emails"
}

resource "aws_api_gateway_resource" "emails_proxy" {
  rest_api_id = data.aws_api_gateway_rest_api.gateway.id
  parent_id   = aws_api_gateway_resource.emails.id
  path_part   = "{proxy+}"
}

resource "aws_api_gateway_method" "emails_any" {
  rest_api_id   = data.aws_api_gateway_rest_api.gateway.id
  resource_id   = aws_api_gateway_resource.emails.id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_method" "emails_proxy_any" {
  rest_api_id   = data.aws_api_gateway_rest_api.gateway.id
  resource_id   = aws_api_gateway_resource.emails_proxy.id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "emails_any" {
  rest_api_id             = data.aws_api_gateway_rest_api.gateway.id
  resource_id             = aws_api_gateway_resource.emails.id
  http_method             = aws_api_gateway_method.emails_any.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.email_mailbox.invoke_arn
}

resource "aws_api_gateway_integration" "emails_proxy_any" {
  rest_api_id             = data.aws_api_gateway_rest_api.gateway.id
  resource_id             = aws_api_gateway_resource.emails_proxy.id
  http_method             = aws_api_gateway_method.emails_proxy_any.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.email_mailbox.invoke_arn
}

resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.email_mailbox.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${data.aws_api_gateway_rest_api.gateway.execution_arn}/*/*/*"
}
