variable "jwt_secret" {
  description = "Secret key for JWT"
  type        = string
  sensitive   = true
}

variable "infinitepay_handle" {
  description = "InfiniteTag da conta InfinitePay, sem o caractere $."
  type        = string
  default     = "dayvison-vicente-ds8"
}

variable "infinitepay_api_url" {
  description = "URL base da API do Checkout Integrado InfinitePay."
  type        = string
  default     = "https://api.checkout.infinitepay.io"
}

variable "infinitepay_redirect_url" {
  description = "URL do site para retorno do cliente depois do pagamento."
  type        = string
  default     = "https://mundocolorestore.com/checkout/infinitepay/payment"
}

variable "infinitepay_webhook_url" {
  description = "URL publica do API Gateway que recebe confirmacoes da InfinitePay."
  type        = string
  default     = "https://mundocolorestore.com/webhook/infinitepay"
}
