variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "sa-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "mundocolore"
}

variable "images_bucket_name" {
  description = "Bucket used to store product and collection images"
  type        = string
  default     = "mundocolorestore-imagems"
}

variable "allowed_cors_origins" {
  description = "Origins allowed to read images from browsers"
  type        = list(string)
  default     = ["*"]
}

variable "public_read_images" {
  description = "When true, product images can be read directly through HTTPS S3 URLs"
  type        = bool
  default     = true
}
