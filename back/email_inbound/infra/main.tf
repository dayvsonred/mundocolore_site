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

locals {
  raw_prefix        = trimsuffix(trimspace(var.raw_prefix), "/")
  rule_set_name     = "mundocolore-inbound-email"
  receipt_rule_name = "mundocolore-store-domain"
  receipt_rule_arn  = "arn:aws:ses:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:receipt-rule-set/${local.rule_set_name}:receipt-rule/${local.receipt_rule_name}"
}

resource "aws_s3_bucket" "email_box" {
  bucket = var.bucket_name
}

resource "aws_s3_bucket_public_access_block" "email_box" {
  bucket = aws_s3_bucket.email_box.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_ownership_controls" "email_box" {
  bucket = aws_s3_bucket.email_box.id

  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_versioning" "email_box" {
  bucket = aws_s3_bucket.email_box.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "email_box" {
  bucket = aws_s3_bucket.email_box.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_ses_receipt_rule_set" "email_box" {
  rule_set_name = local.rule_set_name
}

resource "aws_s3_bucket_policy" "allow_ses" {
  bucket = aws_s3_bucket.email_box.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid       = "AllowSESPuts"
      Effect    = "Allow"
      Principal = { Service = "ses.amazonaws.com" }
      Action    = "s3:PutObject"
      Resource  = "${aws_s3_bucket.email_box.arn}/${local.raw_prefix}/*"
      Condition = {
        StringEquals = {
          "AWS:SourceAccount" = data.aws_caller_identity.current.account_id
          "AWS:SourceArn"     = local.receipt_rule_arn
        }
      }
    }]
  })
}

resource "aws_iam_role" "lambda_role" {
  name = "lb_mundocolore-email-inbound-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy" "lambda_s3" {
  name = "lb_mundocolore-email-inbound-s3"
  role = aws_iam_role.lambda_role.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["s3:GetObject"]
        Resource = "${aws_s3_bucket.email_box.arn}/${local.raw_prefix}/*"
      },
      {
        Effect   = "Allow"
        Action   = ["s3:PutObject"]
        Resource = "${aws_s3_bucket.email_box.arn}/*"
      },
      {
        Effect   = "Allow"
        Action   = ["dynamodb:PutItem"]
        Resource = "arn:aws:dynamodb:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:table/${var.email_table_name}"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_lambda_function" "email_inbound" {
  function_name    = "lb_mundocolore-email_inbound"
  runtime          = "provided.al2023"
  handler          = "bootstrap"
  memory_size      = 512
  timeout          = 60
  filename         = "../lambda.zip"
  source_code_hash = fileexists("../lambda.zip") ? filebase64sha256("../lambda.zip") : null
  role             = aws_iam_role.lambda_role.arn

  environment {
    variables = {
      BUCKET_NAME        = aws_s3_bucket.email_box.id
      RAW_PREFIX         = local.raw_prefix
      DOMAIN_NAME        = var.domain_name
      FORWARD_TO         = var.forward_to
      FORWARD_FROM       = var.forward_from
      FORWARD_FROM_NAME  = var.forward_from_name
      MAILJET_API_KEY    = var.mailjet_api_key
      MAILJET_SECRET_KEY = var.mailjet_secret_key
      TABLE_NAME         = var.email_table_name
    }
  }
}

resource "aws_lambda_permission" "allow_ses" {
  statement_id   = "AllowExecutionFromSES"
  action         = "lambda:InvokeFunction"
  function_name  = aws_lambda_function.email_inbound.function_name
  principal      = "ses.amazonaws.com"
  source_account = data.aws_caller_identity.current.account_id
  source_arn     = local.receipt_rule_arn
}

resource "aws_ses_domain_identity" "email_domain" {
  domain = var.domain_name
}

resource "aws_route53_record" "ses_verification" {
  zone_id = var.hosted_zone_id
  name    = "_amazonses.${var.domain_name}"
  type    = "TXT"
  ttl     = 600
  records = [aws_ses_domain_identity.email_domain.verification_token]
}

resource "aws_ses_domain_identity_verification" "email_domain" {
  domain     = aws_ses_domain_identity.email_domain.id
  depends_on = [aws_route53_record.ses_verification]
}

resource "aws_route53_record" "ses_inbound_mx" {
  zone_id = var.hosted_zone_id
  name    = var.domain_name
  type    = "MX"
  ttl     = 300
  records = ["10 inbound-smtp.${var.aws_region}.amazonaws.com"]
}

resource "aws_ses_receipt_rule" "email_domain" {
  name          = local.receipt_rule_name
  rule_set_name = aws_ses_receipt_rule_set.email_box.rule_set_name
  recipients    = [var.domain_name]
  enabled       = true
  scan_enabled  = true
  tls_policy    = "Optional"

  s3_action {
    bucket_name       = aws_s3_bucket.email_box.id
    object_key_prefix = "${local.raw_prefix}/"
    position          = 1
  }

  lambda_action {
    function_arn    = aws_lambda_function.email_inbound.arn
    invocation_type = "Event"
    position        = 2
  }

  depends_on = [
    aws_lambda_permission.allow_ses,
    aws_s3_bucket_policy.allow_ses,
    aws_ses_domain_identity_verification.email_domain,
  ]
}

resource "aws_ses_active_receipt_rule_set" "email_box" {
  rule_set_name = aws_ses_receipt_rule_set.email_box.rule_set_name
  depends_on    = [aws_ses_receipt_rule.email_domain]
}
