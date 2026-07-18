variable "analytics_table_name" {
  description = "DynamoDB table used by analytics_control"
  type        = string
  default     = "mundocolore-analytics"
}

variable "role_table_name" {
  description = "DynamoDB table used to validate admin access"
  type        = string
  default     = "mundocolore-role"
}

variable "jwt_secret" {
  description = "JWT secret shared with the users lambda"
  type        = string
  sensitive   = true
}
