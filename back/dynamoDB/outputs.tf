output "dynamodb_table_names" {
  description = "Names of the created DynamoDB tables"
  value       = [for table in aws_dynamodb_table.tables : table.name]
}

output "dynamodb_table_arns" {
  description = "ARNs of the created DynamoDB tables"
  value       = { for k, v in aws_dynamodb_table.tables : k => v.arn }
}

output "dynamodb_table_ids" {
  description = "IDs of the created DynamoDB tables"
  value       = { for k, v in aws_dynamodb_table.tables : k => v.id }
}

output "dynamodb_stream_arns" {
  description = "Stream ARNs of the created DynamoDB tables"
  value       = { for k, v in aws_dynamodb_table.tables : k => v.stream_arn }
}

output "iam_policy_arn" {
  description = "ARN of the DynamoDB access IAM policy"
  value       = aws_iam_policy.dynamodb_access.arn
}

output "iam_role_arn" {
  description = "ARN of the DynamoDB access IAM role"
  value       = aws_iam_role.dynamodb_role.arn
}

output "iam_role_name" {
  description = "Name of the DynamoDB access IAM role"
  value       = aws_iam_role.dynamodb_role.name
}