terraform {
  required_version = ">= 1.6.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.113"
    }
  }

  # Optional: Configure remote state storage
  # backend "azurerm" {
  #   resource_group_name  = "terraform-state-rg"
  #   storage_account_name = "tfstatemagnusflipperai"
  #   container_name       = "tfstate"
  #   key                  = "magnus-flipper-ai.tfstate"
  # }
}

provider "azurerm" {
  features {}
  subscription_id = var.subscription_id
}

# ===========================================================================
# Resource Group
# ===========================================================================
resource "azurerm_resource_group" "rg" {
  name     = var.resource_group_name
  location = var.location

  tags = {
    Environment = var.node_env
    Project     = "Magnus-Flipper-AI"
    ManagedBy   = "Terraform"
  }
}

# ===========================================================================
# Log Analytics Workspace (for Container Apps monitoring)
# ===========================================================================
resource "azurerm_log_analytics_workspace" "logs" {
  name                = "magnus-log-analytics"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  sku                 = "PerGB2018"
  retention_in_days   = 30

  tags = {
    Environment = var.node_env
    Project     = "Magnus-Flipper-AI"
  }
}

# ===========================================================================
# Azure Container Registry
# ===========================================================================
resource "azurerm_container_registry" "acr" {
  name                = var.acr_name
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  sku                 = "Basic"
  admin_enabled       = true

  tags = {
    Environment = var.node_env
    Project     = "Magnus-Flipper-AI"
  }
}

# ===========================================================================
# Azure Cache for Redis
# ===========================================================================
resource "azurerm_redis_cache" "redis" {
  name                = var.redis_name
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  capacity            = 1
  family              = "C"
  sku_name            = "Standard"
  enable_non_ssl_port = false
  minimum_tls_version = "1.2"

  redis_configuration {
    maxmemory_policy = "allkeys-lru"
  }

  tags = {
    Environment = var.node_env
    Project     = "Magnus-Flipper-AI"
  }
}

# ===========================================================================
# Container Apps Environment
# ===========================================================================
resource "azurerm_container_app_environment" "ca_env" {
  name                       = var.containerapps_env_name
  location                   = azurerm_resource_group.rg.location
  resource_group_name        = azurerm_resource_group.rg.name
  log_analytics_workspace_id = azurerm_log_analytics_workspace.logs.id

  tags = {
    Environment = var.node_env
    Project     = "Magnus-Flipper-AI"
  }
}

# ===========================================================================
# Container App: API
# ===========================================================================
resource "azurerm_container_app" "api" {
  name                         = "magnus-api"
  resource_group_name          = azurerm_resource_group.rg.name
  container_app_environment_id = azurerm_container_app_environment.ca_env.id
  revision_mode                = "Single"

  registry {
    server               = azurerm_container_registry.acr.login_server
    username             = azurerm_container_registry.acr.admin_username
    password_secret_name = "acr-password"
  }

  secret {
    name  = "acr-password"
    value = azurerm_container_registry.acr.admin_password
  }

  secret {
    name  = "database-url"
    value = var.database_url
  }

  secret {
    name  = "supabase-url"
    value = var.supabase_url
  }

  secret {
    name  = "supabase-anon-key"
    value = var.supabase_anon_key
  }

  secret {
    name  = "supabase-service-role-key"
    value = var.supabase_service_role_key
  }

  secret {
    name  = "jwt-secret"
    value = var.jwt_secret
  }

  secret {
    name  = "redis-host"
    value = azurerm_redis_cache.redis.hostname
  }

  secret {
    name  = "redis-key"
    value = azurerm_redis_cache.redis.primary_access_key
  }

  ingress {
    external_enabled = true
    target_port      = 4000
    transport        = "auto"

    traffic_weight {
      latest_revision = true
      percentage      = 100
    }
  }

  template {
    container {
      name   = "api"
      image  = "${azurerm_container_registry.acr.login_server}/magnus-api:latest"
      cpu    = 0.5
      memory = "1Gi"

      env {
        name        = "DATABASE_URL"
        secret_name = "database-url"
      }

      env {
        name        = "SUPABASE_URL"
        secret_name = "supabase-url"
      }

      env {
        name        = "SUPABASE_ANON_KEY"
        secret_name = "supabase-anon-key"
      }

      env {
        name        = "SUPABASE_SERVICE_ROLE_KEY"
        secret_name = "supabase-service-role-key"
      }

      env {
        name        = "JWT_SECRET"
        secret_name = "jwt-secret"
      }

      env {
        name        = "REDIS_HOST"
        secret_name = "redis-host"
      }

      env {
        name        = "REDIS_KEY"
        secret_name = "redis-key"
      }

      env {
        name  = "REDIS_PORT"
        value = "6380"
      }

      env {
        name  = "REDIS_TLS"
        value = "true"
      }

      env {
        name  = "NODE_ENV"
        value = var.node_env
      }

      env {
        name  = "PORT"
        value = "4000"
      }
    }

    min_replicas = var.api_min_replicas
    max_replicas = var.api_max_replicas
  }

  tags = {
    Environment = var.node_env
    Project     = "Magnus-Flipper-AI"
  }
}

# ===========================================================================
# Container Apps Job: Saved Search Alerts Worker
# ===========================================================================
resource "azurerm_container_app_job" "alerts_job" {
  name                         = "worker-alerts-job"
  resource_group_name          = azurerm_resource_group.rg.name
  location                     = azurerm_resource_group.rg.location
  container_app_environment_id = azurerm_container_app_environment.ca_env.id

  replica_timeout_in_seconds = 600
  replica_retry_limit        = 1

  # Manual trigger config (can be invoked via API or CLI)
  manual_trigger_config {
    parallelism              = 1
    replica_completion_count = 1
  }

  # Schedule trigger config (cron: every 5 minutes)
  schedule_trigger_config {
    cron_expression = "*/5 * * * *"
    parallelism     = 1
  }

  registry {
    server               = azurerm_container_registry.acr.login_server
    username             = azurerm_container_registry.acr.admin_username
    password_secret_name = "acr-password"
  }

  secret {
    name  = "acr-password"
    value = azurerm_container_registry.acr.admin_password
  }

  secret {
    name  = "database-url"
    value = var.database_url
  }

  secret {
    name  = "supabase-url"
    value = var.supabase_url
  }

  secret {
    name  = "supabase-service-role-key"
    value = var.supabase_service_role_key
  }

  secret {
    name  = "redis-host"
    value = azurerm_redis_cache.redis.hostname
  }

  secret {
    name  = "redis-key"
    value = azurerm_redis_cache.redis.primary_access_key
  }

  template {
    container {
      name   = "alerts-worker"
      image  = "${azurerm_container_registry.acr.login_server}/alerts-worker:latest"
      cpu    = 0.25
      memory = "0.5Gi"

      env {
        name  = "DATABASE_URL"
        secret_name = "database-url"
      }

      env {
        name        = "SUPABASE_URL"
        secret_name = "supabase-url"
      }

      env {
        name        = "SUPABASE_SERVICE_ROLE_KEY"
        secret_name = "supabase-service-role-key"
      }

      env {
        name        = "REDIS_HOST"
        secret_name = "redis-host"
      }

      env {
        name        = "REDIS_KEY"
        secret_name = "redis-key"
      }

      env {
        name  = "REDIS_PORT"
        value = "6380"
      }

      env {
        name  = "REDIS_TLS"
        value = "true"
      }

      env {
        name  = "NODE_ENV"
        value = var.node_env
      }
    }
  }

  tags = {
    Environment = var.node_env
    Project     = "Magnus-Flipper-AI"
  }
}
