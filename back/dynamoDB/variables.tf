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
      name            = string
      hash_key        = string
      range_key       = optional(string)
      projection_type = string
      read_capacity   = optional(number)
      write_capacity  = optional(number)
    })), [])
    read_capacity  = optional(number, 5)
    write_capacity = optional(number, 5)
  }))
  default = {
    users = {
      name          = "mundocolore-users"
      billing_mode  = "PAY_PER_REQUEST"
      hash_key      = "id"
      hash_key_type = "S"
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
    role = {
      name          = "mundocolore-role"
      billing_mode  = "PAY_PER_REQUEST"
      hash_key      = "id"
      hash_key_type = "S"
    }
    credit = {
      name          = "mundocolore-credit"
      billing_mode  = "PAY_PER_REQUEST"
      hash_key      = "user_id"
      hash_key_type = "S"
    }
    products = {
      name          = "mundocolore-products"
      billing_mode  = "PAY_PER_REQUEST"
      hash_key      = "id"
      hash_key_type = "S"
      attributes = [
        {
          name = "category"
          type = "S"
        },
        {
          name = "entity_type"
          type = "S"
        },
        {
          name = "brand_key"
          type = "S"
        },
        {
          name = "collection_key"
          type = "S"
        },
        {
          name = "type_key"
          type = "S"
        },
        {
          name = "product_id"
          type = "S"
        }
      ]
      global_secondary_indexes = [
        {
          name            = "category-index"
          hash_key        = "category"
          projection_type = "ALL"
        },
        {
          name            = "entity-type-index"
          hash_key        = "entity_type"
          range_key       = "id"
          projection_type = "ALL"
        },
        {
          name            = "brand-index"
          hash_key        = "brand_key"
          range_key       = "id"
          projection_type = "ALL"
        },
        {
          name            = "collection-index"
          hash_key        = "collection_key"
          range_key       = "product_id"
          projection_type = "ALL"
        },
        {
          name            = "type-index"
          hash_key        = "type_key"
          range_key       = "id"
          projection_type = "ALL"
        },
        {
          name            = "product-id-index"
          hash_key        = "product_id"
          range_key       = "id"
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
    emails = {
      name          = "mundocolore-emails"
      billing_mode  = "PAY_PER_REQUEST"
      hash_key      = "id"
      hash_key_type = "S"
      attributes = [
        {
          name = "id"
          type = "S"
        },
        {
          name = "type"
          type = "S"
        },
        {
          name = "to_email"
          type = "S"
        },
        {
          name = "received_at"
          type = "S"
        },
        {
          name = "mailbox"
          type = "S"
        },
        {
          name = "received_sort"
          type = "S"
        }
      ]
      global_secondary_indexes = [
        {
          name            = "type-received-index"
          hash_key        = "type"
          range_key       = "received_at"
          projection_type = "ALL"
        },
        {
          name            = "to-email-received-index"
          hash_key        = "to_email"
          range_key       = "received_at"
          projection_type = "ALL"
        },
        {
          name            = "mailbox-received-index"
          hash_key        = "mailbox"
          range_key       = "received_sort"
          projection_type = "ALL"
        }
      ]
    }
    analytics = {
      name           = "mundocolore-analytics"
      billing_mode   = "PAY_PER_REQUEST"
      hash_key       = "server_day"
      hash_key_type  = "S"
      range_key      = "server_at_event_id"
      range_key_type = "S"
      attributes = [
        {
          name = "day_route"
          type = "S"
        },
        {
          name = "day_event_type"
          type = "S"
        },
        {
          name = "day_product_code"
          type = "S"
        },
        {
          name = "day_brand_key"
          type = "S"
        }
      ]
      global_secondary_indexes = [
        {
          name            = "day-route-index"
          hash_key        = "day_route"
          range_key       = "server_at_event_id"
          projection_type = "ALL"
        },
        {
          name            = "day-event-type-index"
          hash_key        = "day_event_type"
          range_key       = "server_at_event_id"
          projection_type = "ALL"
        },
        {
          name            = "day-product-code-index"
          hash_key        = "day_product_code"
          range_key       = "server_at_event_id"
          projection_type = "ALL"
        },
        {
          name            = "day-brand-index"
          hash_key        = "day_brand_key"
          range_key       = "server_at_event_id"
          projection_type = "ALL"
        }
      ]
    }
  }
}
