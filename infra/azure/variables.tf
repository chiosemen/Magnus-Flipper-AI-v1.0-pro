variable "subscription_id" {
  description = "Azure subscription ID"
  type        = string
}

variable "location" {
  description = "Azure region for resources"
  type        = string
}

variable "resource_group_name" {
  description = "Name of the resource group"
  type        = string
}

variable "acr_name" {
  description = "Name of the Azure Container Registry"
  type        = string
}

variable "containerapps_env_name" {
  description = "Name of the Container Apps environment"
  type        = string
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

variable "stripe_secret_key" {
  description = "Stripe secret key for payments"
  type        = string
  sensitive   = true
}

variable "stripe_webhook_secret" {
  description = "Stripe webhook secret"
  type        = string
  sensitive   = true
}

variable "openai_key" {
  description = "OpenAI API key"
  type        = string
  sensitive   = true
}

variable "app_url" {
  description = "Application URL (e.g., https://magnus.ai)"
  type        = string
}

variable "demo_mode" {
  description = "Enable demo mode (true/false)"
  type        = string
  default     = "false"
}

variable "log_level" {
  description = "Log level (debug, info, warn, error)"
  type        = string
  default     = "info"
}

variable "image_tag" {
  description = "Docker image tag to deploy"
  type        = string
  default     = "latest"
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
