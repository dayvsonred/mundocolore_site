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

# API Gateway
resource "aws_api_gateway_rest_api" "mundocolore_gateway" {
  name        = "mundocolore-gateway"
  description = "API Gateway for Mundo Colore Lambdas"
}

output "api_gateway_id" {
  value = aws_api_gateway_rest_api.mundocolore_gateway.id
}

output "api_gateway_execution_arn" {
  value = aws_api_gateway_rest_api.mundocolore_gateway.execution_arn
}

output "api_gateway_invoke_base" {
  value = "https://${aws_api_gateway_rest_api.mundocolore_gateway.id}.execute-api.sa-east-1.amazonaws.com"
}
