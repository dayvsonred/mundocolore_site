output "images_bucket_name" {
  description = "S3 bucket name used for product images"
  value       = aws_s3_bucket.images.bucket
}

output "images_bucket_arn" {
  description = "S3 bucket ARN"
  value       = aws_s3_bucket.images.arn
}

output "images_bucket_domain_name" {
  description = "Regional S3 domain name"
  value       = aws_s3_bucket.images.bucket_regional_domain_name
}

output "images_base_url" {
  description = "Base URL used by the products lambda when IMAGE_BASE_URL is enabled"
  value       = "https://${aws_s3_bucket.images.bucket_regional_domain_name}"
}
