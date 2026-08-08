output "lambda_arn" {
  value = aws_lambda_function.payments_lambda.arn
}

output "infinitepay_redirect_url" {
  value = var.infinitepay_redirect_url
}

output "infinitepay_webhook_url" {
  value = var.infinitepay_webhook_url
}

output "api_gateway_id" {
  value = data.aws_api_gateway_rest_api.gateway.id
}
