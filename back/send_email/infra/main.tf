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

resource "aws_sqs_queue" "email_queue" {
  name                       = "mundocolore-send-email"
  visibility_timeout_seconds = 60
  message_retention_seconds  = 1209600
}

resource "aws_iam_role" "lambda_role" {
  name = "lb_mundocolore-send-email-role"
  assume_role_policy = jsonencode({
    Version   = "2012-10-17"
    Statement = [{ Action = "sts:AssumeRole", Effect = "Allow", Principal = { Service = "lambda.amazonaws.com" } }]
  })
}

resource "aws_iam_role_policy" "lambda_policy" {
  name = "lb_mundocolore-send-email-policy"
  role = aws_iam_role.lambda_role.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem"]
        Resource = [
          "arn:aws:dynamodb:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:table/mundocolore-emails"
        ]
      },
      {
        Effect   = "Allow"
        Action   = ["sqs:ReceiveMessage", "sqs:DeleteMessage", "sqs:GetQueueAttributes"]
        Resource = aws_sqs_queue.email_queue.arn
      }
    ]
  })
}

resource "aws_lambda_function" "send_email_lambda" {
  function_name    = "lb_mundocolore-send-email"
  runtime          = "provided.al2023"
  handler          = "bootstrap"
  memory_size      = 128
  timeout          = 30
  filename         = "../lambda.zip"
  source_code_hash = fileexists("../lambda.zip") ? filebase64sha256("../lambda.zip") : null
  role             = aws_iam_role.lambda_role.arn

  environment {
    variables = {
      MAILJET_API_KEY     = var.mailjet_api_key
      MAILJET_SECRET_KEY  = var.mailjet_secret_key
      EMAIL_FROM          = var.email_from
      EMAIL_FROM_NAME     = var.email_from_name
      ALLOWED_FROM_EMAILS = var.allowed_from_emails
      TABLE_NAME          = "mundocolore-emails"
    }
  }
}

resource "aws_lambda_event_source_mapping" "email_queue_mapping" {
  event_source_arn = aws_sqs_queue.email_queue.arn
  function_name    = aws_lambda_function.send_email_lambda.arn
  batch_size       = 5
  enabled          = true
}

resource "aws_api_gateway_resource" "newsletter" {
  rest_api_id = data.aws_api_gateway_rest_api.gateway.id
  parent_id   = data.aws_api_gateway_rest_api.gateway.root_resource_id
  path_part   = "newsletter"
}

resource "aws_api_gateway_method" "newsletter_post" {
  rest_api_id   = data.aws_api_gateway_rest_api.gateway.id
  resource_id   = aws_api_gateway_resource.newsletter.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "newsletter_post" {
  rest_api_id             = data.aws_api_gateway_rest_api.gateway.id
  resource_id             = aws_api_gateway_resource.newsletter.id
  http_method             = aws_api_gateway_method.newsletter_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.send_email_lambda.invoke_arn
}

resource "aws_api_gateway_method" "newsletter_options" {
  rest_api_id   = data.aws_api_gateway_rest_api.gateway.id
  resource_id   = aws_api_gateway_resource.newsletter.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_method_response" "newsletter_options" {
  rest_api_id = data.aws_api_gateway_rest_api.gateway.id
  resource_id = aws_api_gateway_resource.newsletter.id
  http_method = aws_api_gateway_method.newsletter_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration" "newsletter_options" {
  rest_api_id = data.aws_api_gateway_rest_api.gateway.id
  resource_id = aws_api_gateway_resource.newsletter.id
  http_method = aws_api_gateway_method.newsletter_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_integration_response" "newsletter_options" {
  rest_api_id = data.aws_api_gateway_rest_api.gateway.id
  resource_id = aws_api_gateway_resource.newsletter.id
  http_method = aws_api_gateway_method.newsletter_options.http_method
  status_code = aws_api_gateway_method_response.newsletter_options.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type'"
    "method.response.header.Access-Control-Allow-Methods" = "'POST,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowNewsletterFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.send_email_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${data.aws_api_gateway_rest_api.gateway.execution_arn}/*/POST/newsletter"
}

resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}
