variable "aws_region" {
  description = "AWS region used by the mailbox API"
  type        = string
  default     = "sa-east-1"
}

variable "aws_account_id" {
  description = "Mundo Colore AWS account ID"
  type        = string
  default     = "261955339827"
}

variable "email_table_name" {
  type    = string
  default = "mundocolore-emails"
}

variable "role_table_name" {
  type    = string
  default = "mundocolore-role"
}

variable "mailbox_index_name" {
  type    = string
  default = "mailbox-received-index"
}

variable "bucket_name" {
  type    = string
  default = "box-email-mundocolorestore-v1"
}

variable "email_queue_name" {
  type    = string
  default = "mundocolore-send-email"
}

variable "allowed_mailboxes" {
  description = "Comma-separated mailbox and sender allowlist"
  type        = string
  default     = "contato@mundocolorestore.com"
}

variable "jwt_secret" {
  description = "JWT secret shared with the users lambda"
  type        = string
  sensitive   = true
}
