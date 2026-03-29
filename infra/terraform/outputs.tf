output "bucket_name" {
  description = "S3 bucket used to store static site files."
  value       = aws_s3_bucket.site.bucket
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution id."
  value       = aws_cloudfront_distribution.site.id
}

output "cloudfront_domain_name" {
  description = "Public CloudFront domain (works even without custom domain)."
  value       = aws_cloudfront_distribution.site.domain_name
}

output "site_url" {
  description = "Preferred URL for access."
  value       = "https://${local.default_primary_site_domain}"
}

