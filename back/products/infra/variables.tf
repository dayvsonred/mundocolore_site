variable "jwt_secret" {
  description = "Secret used to validate admin JWT tokens"
  type        = string
  sensitive   = true
}
