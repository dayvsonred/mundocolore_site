# DynamoDB Tables
resource "aws_dynamodb_table" "tables" {
  for_each = var.dynamodb_tables

  name         = each.value.name
  billing_mode = each.value.billing_mode
  hash_key     = each.value.hash_key

  dynamic "attribute" {
    for_each = concat([
      {
        name = each.value.hash_key
        type = each.value.hash_key_type
      }
    ], each.value.range_key != null ? [
      {
        name = each.value.range_key
        type = each.value.range_key_type
      }
    ] : [], each.value.attributes != null ? each.value.attributes : [])

    content {
      name = attribute.value.name
      type = attribute.value.type
    }
  }

  # Range key
  range_key = each.value.range_key

  # Global Secondary Indexes
  dynamic "global_secondary_index" {
    for_each = each.value.global_secondary_indexes != null ? each.value.global_secondary_indexes : []

    content {
      name               = global_secondary_index.value.name
      hash_key           = global_secondary_index.value.hash_key
      range_key          = global_secondary_index.value.range_key
      projection_type    = global_secondary_index.value.projection_type
      read_capacity      = global_secondary_index.value.read_capacity
      write_capacity     = global_secondary_index.value.write_capacity
    }
  }

  # Provisioned throughput (only for PROVISIONED billing mode)
  read_capacity  = each.value.billing_mode == "PROVISIONED" ? each.value.read_capacity : null
  write_capacity = each.value.billing_mode == "PROVISIONED" ? each.value.write_capacity : null

  # Point-in-time recovery
  point_in_time_recovery {
    enabled = true
  }

  # Server-side encryption
  server_side_encryption {
    enabled = true
  }

  # Stream specification (optional)
  stream_view_type = "NEW_AND_OLD_IMAGES"

  tags = {
    Name        = each.value.name
    Environment = var.environment
    Project     = var.project_name
  }
}

# IAM Policy for DynamoDB access
resource "aws_iam_policy" "dynamodb_access" {
  name        = "${var.project_name}-dynamodb-access-${var.environment}"
  description = "IAM policy for DynamoDB access"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:BatchGetItem",
          "dynamodb:BatchWriteItem",
          "dynamodb:DescribeTable"
        ]
        Resource = [
          for table in aws_dynamodb_table.tables : table.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:ListTables"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

# IAM Role for application (optional - for EC2/ECS/Lambda)
resource "aws_iam_role" "dynamodb_role" {
  name = "${var.project_name}-dynamodb-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

# Attach policy to role
resource "aws_iam_role_policy_attachment" "dynamodb_attachment" {
  role       = aws_iam_role.dynamodb_role.name
  policy_arn = aws_iam_policy.dynamodb_access.arn
}