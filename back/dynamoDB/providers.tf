terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  # Proteção de conta AWS
  allowed_account_ids = ["261955339827"]

  default_tags {
    tags = {
      Project     = "MundoColore"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}