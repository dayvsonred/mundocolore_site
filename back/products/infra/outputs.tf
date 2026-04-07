output "lambda_arn" {
  value = aws_lambda_function.products_lambda.arn
}

output "api_gateway_id" {
  value = data.aws_api_gateway_rest_api.gateway.id
}