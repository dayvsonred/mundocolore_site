variable "aws_region" {
  description = "AWS region for S3 and CloudFront resources."
  type        = string
  default     = "sa-east-1"
}

variable "allowed_account_id" {
  description = "Expected AWS account ID. Terraform fails if credentials point to another account."
  type        = string
  default     = "261955339827"

  validation {
    condition     = can(regex("^\\d{12}$", var.allowed_account_id))
    error_message = "allowed_account_id must be a 12-digit AWS account ID."
  }
}

variable "project_name" {
  description = "Project identifier used in tags."
  type        = string
  default     = "mundocolore"
}

variable "environment" {
  description = "Environment name (for tags and naming)."
  type        = string
  default     = "prod"
}

variable "bucket_name" {
  description = "Global unique bucket name to store static files."
  type        = string
}

variable "upload_build_files" {
  description = "When true, upload local Angular build artifacts to S3 during terraform apply."
  type        = bool
  default     = true
}

variable "build_output_path" {
  description = "Path to Angular build output directory (absolute or relative to infra/terraform)."
  type        = string
  default     = "../../site/dist/mundocolore"
}

variable "force_destroy_bucket" {
  description = "Allow bucket deletion even if it contains objects."
  type        = bool
  default     = false
}

variable "price_class" {
  description = "CloudFront price class."
  type        = string
  default     = "PriceClass_100"
}

variable "spa_mode" {
  description = "If true, CloudFront rewrites 403/404 to /index.html (SPA fallback)."
  type        = bool
  default     = true
}

variable "domain_names" {
  description = "Custom domains for CloudFront (example: [\"example.com\", \"www.example.com\"]). Keep empty until domain is ready."
  type        = list(string)
  default     = []
}

variable "hosted_zone_id" {
  description = "Route53 hosted zone id used for DNS and ACM validation."
  type        = string
  default     = ""
}

variable "create_route53_records" {
  description = "Create Route53 A records pointing domain_names to CloudFront."
  type        = bool
  default     = false
}

variable "acm_certificate_arn" {
  description = "Existing ACM certificate ARN in us-east-1. If empty and domain_names not empty, Terraform can create one."
  type        = string
  default     = ""
}

variable "create_acm_certificate" {
  description = "Create ACM certificate in us-east-1 when domain_names is set."
  type        = bool
  default     = true
}
