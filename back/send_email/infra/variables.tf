variable "brevo_api_key" {
  description = "Brevo API key loaded from back/send_email/.chave_brevo_api_key by deploy_lambdas.py"
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
