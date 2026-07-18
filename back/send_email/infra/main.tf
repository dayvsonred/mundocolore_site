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
      MAILJET_API_KEY    = var.mailjet_api_key
      MAILJET_SECRET_KEY = var.mailjet_secret_key
      EMAIL_FROM         = var.email_from
      EMAIL_FROM_NAME    = var.email_from_name
      TABLE_NAME         = "mundocolore-emails"
    }
  }
}

resource "aws_lambda_event_source_mapping" "email_queue_mapping" {
  event_source_arn = aws_sqs_queue.email_queue.arn
  function_name    = aws_lambda_function.send_email_lambda.arn
  batch_size       = 5
  enabled          = true
}

resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}
