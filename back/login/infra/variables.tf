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
