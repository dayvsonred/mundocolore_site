variable "mailjet_api_key" {
  description = "Mailjet API key loaded from back/send_email/.mailjet_api_key by deploy_lambdas.py"
  type        = string
  sensitive   = true
}

variable "mailjet_secret_key" {
  description = "Mailjet secret key loaded from back/send_email/.mailjet_api_key by deploy_lambdas.py"
  type        = string
  sensitive   = true
}

variable "email_from" {
  description = "Sender email address"
  type        = string
  default     = "contato@mundocolorestore.com"
}

variable "email_from_name" {
  description = "Sender display name"
  type        = string
  default     = "Mundo Colore Store"
}
