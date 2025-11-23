variable "subscription_id" {
  description = "Azure subscription ID"
  type        = string
}

variable "location" {
  description = "Azure region for resources"
  type        = string
  default     = "eastus"
}

variable "resource_group_name" {
  description = "Name of the resource group"
  type        = string
  default     = "magnus-rg"
}

variable "acr_name" {
  description = "Name of the Azure Container Registry"
  type        = string
  default     = "magnusacr"
}

variable "containerapps_env_name" {
  description = "Name of the Container Apps environment"
  type        = string
  default     = "magnus-ca-env"
}

variable "redis_name" {
  description = "Name of the Azure Redis cache"
  type        = string
  default     = "magnus-redis"
}

variable "database_url" {
  description = "Database connection string (Supabase or Azure PostgreSQL)"
  type        = string
  sensitive   = true
}

variable "supabase_url" {
  description = "Supabase project URL"
  type        = string
}

variable "supabase_anon_key" {
  description = "Supabase anon key"
  type        = string
  sensitive   = true
}

variable "supabase_service_role_key" {
  description = "Supabase service role key"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "JWT secret for API authentication"
  type        = string
  sensitive   = true
}

variable "node_env" {
  description = "Node environment (production, staging, development)"
  type        = string
  default     = "production"
}

variable "api_min_replicas" {
  description = "Minimum number of API replicas"
  type        = number
  default     = 1
}

variable "api_max_replicas" {
  description = "Maximum number of API replicas"
  type        = number
  default     = 5
}
