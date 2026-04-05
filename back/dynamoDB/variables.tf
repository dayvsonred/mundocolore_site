variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "sa-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "mundocolore"
}

# DynamoDB Tables Configuration
variable "dynamodb_tables" {
  description = "Configuration for DynamoDB tables"
  type = map(object({
    name           = string
    billing_mode   = string
    hash_key       = string
    hash_key_type  = string
    range_key      = optional(string)
    range_key_type = optional(string)
    attributes = optional(list(object({
      name = string
      type = string
    })), [])
    global_secondary_indexes = optional(list(object({
      name               = string
      hash_key           = string
      range_key          = optional(string)
      projection_type    = string
      read_capacity      = optional(number)
      write_capacity     = optional(number)
    })), [])
    read_capacity  = optional(number, 5)
    write_capacity = optional(number, 5)
  }))
  default = {
    users = {
      name           = "mundocolore-users"
      billing_mode   = "PAY_PER_REQUEST"
      hash_key       = "id"
      hash_key_type  = "S"
      attributes = [
        {
          name = "id"
          type = "S"
        },
        {
          name = "email"
          type = "S"
        }
      ]
      global_secondary_indexes = [
        {
          name            = "email-index"
          hash_key        = "email"
          projection_type = "ALL"
        }
      ]
    }
    products = {
      name           = "mundocolore-products"
      billing_mode   = "PAY_PER_REQUEST"
      hash_key       = "id"
      hash_key_type  = "S"
      attributes = [
        {
          name = "id"
          type = "S"
        },
        {
          name = "category"
          type = "S"
        }
      ]
      global_secondary_indexes = [
        {
          name            = "category-index"
          hash_key        = "category"
          projection_type = "ALL"
        }
      ]
    }
    orders = {
      name           = "mundocolore-orders"
      billing_mode   = "PAY_PER_REQUEST"
      hash_key       = "id"
      hash_key_type  = "S"
      range_key      = "user_id"
      range_key_type = "S"
      attributes = [
        {
          name = "id"
          type = "S"
        },
        {
          name = "user_id"
          type = "S"
        },
        {
          name = "created_at"
          type = "S"
        }
      ]
      global_secondary_indexes = [
        {
          name            = "user-created-index"
          hash_key        = "user_id"
          range_key       = "created_at"
          projection_type = "ALL"
        }
      ]
    }
    addresses = {
      name           = "mundocolore-addresses"
      billing_mode   = "PAY_PER_REQUEST"
      hash_key       = "id"
      hash_key_type  = "S"
      range_key      = "user_id"
      range_key_type = "S"
      attributes = [
        {
          name = "id"
          type = "S"
        },
        {
          name = "user_id"
          type = "S"
        }
      ]
    }
    payments = {
      name           = "mundocolore-payments"
      billing_mode   = "PAY_PER_REQUEST"
      hash_key       = "id"
      hash_key_type  = "S"
      range_key      = "order_id"
      range_key_type = "S"
      attributes = [
        {
          name = "id"
          type = "S"
        },
        {
          name = "order_id"
          type = "S"
        }
      ]
    }
  }
}