variable "aws_region" {
  description = "AWS region used by SES receiving, Lambda and S3"
  type        = string
  default     = "sa-east-1"
}

variable "aws_account_id" {
  description = "Mundo Colore AWS account ID"
  type        = string
  default     = "261955339827"
}

variable "hosted_zone_id" {
  description = "Route53 hosted zone for mundocolorestore.com"
  type        = string
  default     = "Z10146113ILOCUEJRTN6U"
}

variable "domain_name" {
  description = "Domain accepted by the SES receipt rule"
  type        = string
  default     = "mundocolorestore.com"
}

variable "bucket_name" {
  description = "Private bucket used as the inbound email archive"
  type        = string
  default     = "box-email-mundocolorestore-v1"
}

variable "raw_prefix" {
  description = "Technical prefix where SES first stores raw messages"
  type        = string
  default     = "ses-raw"
}

variable "email_table_name" {
  description = "DynamoDB table used to index inbound email metadata"
  type        = string
  default     = "mundocolore-emails"
}

variable "forward_to" {
  description = "Address that receives a copy of every inbound message"
  type        = string
  default     = "marinaluciara1986@gmail.com"
}

variable "forward_from" {
  description = "Mailjet-verified sender used for forwarded messages"
  type        = string
  default     = "contato@mundocolorestore.com"
}

variable "forward_from_name" {
  description = "Sender name used by Mailjet"
  type        = string
  default     = "Mundo Colore Store"
}

variable "mailjet_api_key" {
  description = "Mailjet API key loaded from back/.mailjet_api_key"
  type        = string
  sensitive   = true
}

variable "mailjet_secret_key" {
  description = "Mailjet secret key loaded from back/.mailjet_api_key"
  type        = string
  sensitive   = true
}
