output "email_queue_url" {
  value = aws_sqs_queue.email_queue.url
}

output "email_queue_arn" {
  value = aws_sqs_queue.email_queue.arn
}
