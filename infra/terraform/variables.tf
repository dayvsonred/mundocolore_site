variable "aws_region" {
  description = "AWS region for S3 and CloudFront resources."
  type        = string
  default     = "sa-east-1"
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

