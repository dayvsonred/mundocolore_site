variable "jwt_secret" {
  description = "Secret key for JWT"
  type        = string
  sensitive   = true
}

variable "login_basic_auth" {
  description = "Expected Authorization header value for /login"
  type        = string
  default     = "Basic QVBJX05BTUVfQUNDRVNTOkFQSV9TRUNSRVRfQUNDRVNT"
}

variable "google_client_id" {
  description = "Fallback Google OAuth 2.0 Web client ID when the local credentials file is unavailable"
  type        = string
  default     = ""
}

variable "google_credentials_file" {
  description = "Path, relative to this Terraform module, to the local Google OAuth Web credentials JSON"
  type        = string
  default     = "../../.google_key"
}
