output "bucket_name" {
  value = aws_s3_bucket.email_box.id
}

output "lambda_arn" {
  value = aws_lambda_function.email_inbound.arn
}

output "receipt_rule_set" {
  value = aws_ses_receipt_rule_set.email_box.rule_set_name
}

output "mx_record" {
  value = aws_route53_record.ses_inbound_mx.fqdn
}

