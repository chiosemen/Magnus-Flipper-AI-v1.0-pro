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
    name  = "stripe-secret-key"
    value = var.stripe_secret_key
  }

  secret {
    name  = "stripe-webhook-secret"
    value = var.stripe_webhook_secret
  }

  secret {
    name  = "openai-key"
    value = var.openai_key
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
      image  = "${azurerm_container_registry.acr.login_server}/magnus-api:${var.image_tag}"
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
        name        = "STRIPE_SECRET_KEY"
        secret_name = "stripe-secret-key"
      }

      env {
        name        = "STRIPE_WEBHOOK_SECRET"
        secret_name = "stripe-webhook-secret"
      }

      env {
        name        = "OPENAI_API_KEY"
        secret_name = "openai-key"
      }

      env {
        name  = "APP_URL"
        value = var.app_url
      }

      env {
        name  = "DEMO_MODE"
        value = var.demo_mode
      }

      env {
        name  = "NODE_ENV"
        value = var.node_env
      }

      env {
        name  = "PORT"
        value = "4000"
      }

      env {
        name  = "LOG_LEVEL"
        value = var.log_level
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

  template {
    container {
      name   = "alerts-worker"
      image  = "${azurerm_container_registry.acr.login_server}/magnus-worker-alerts:${var.image_tag}"
      cpu    = 0.25
      memory = "0.5Gi"

      env {
        name        = "DATABASE_URL"
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
        name  = "NODE_ENV"
        value = var.node_env
      }

      env {
        name  = "LOG_LEVEL"
        value = var.log_level
      }
    }
  }

  tags = {
    Environment = var.node_env
    Project     = "Magnus-Flipper-AI"
  }
}

# ===========================================================================
# Container Apps Job: Crawler Worker
# ===========================================================================
resource "azurerm_container_app_job" "crawler_job" {
  name                         = "worker-crawler-job"
  resource_group_name          = azurerm_resource_group.rg.name
  location                     = azurerm_resource_group.rg.location
  container_app_environment_id = azurerm_container_app_environment.ca_env.id

  replica_timeout_in_seconds = 900
  replica_retry_limit        = 1

  manual_trigger_config {
    parallelism              = 1
    replica_completion_count = 1
  }

  schedule_trigger_config {
    cron_expression = "*/10 * * * *"
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

  template {
    container {
      name   = "crawler-worker"
      image  = "${azurerm_container_registry.acr.login_server}/magnus-worker-crawler:${var.image_tag}"
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
        name        = "SUPABASE_SERVICE_ROLE_KEY"
        secret_name = "supabase-service-role-key"
      }

      env {
        name  = "NODE_ENV"
        value = var.node_env
      }

      env {
        name  = "LOG_LEVEL"
        value = var.log_level
      }
    }
  }

  tags = {
    Environment = var.node_env
    Project     = "Magnus-Flipper-AI"
  }
}

# ===========================================================================
# Container Apps Job: Scheduler Worker
# ===========================================================================
resource "azurerm_container_app_job" "scheduler_job" {
  name                         = "worker-scheduler-job"
  resource_group_name          = azurerm_resource_group.rg.name
  location                     = azurerm_resource_group.rg.location
  container_app_environment_id = azurerm_container_app_environment.ca_env.id

  replica_timeout_in_seconds = 300
  replica_retry_limit        = 1

  manual_trigger_config {
    parallelism              = 1
    replica_completion_count = 1
  }

  schedule_trigger_config {
    cron_expression = "* * * * *"
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

  template {
    container {
      name   = "scheduler-worker"
      image  = "${azurerm_container_registry.acr.login_server}/magnus-scheduler:${var.image_tag}"
      cpu    = 0.25
      memory = "0.5Gi"

      env {
        name        = "DATABASE_URL"
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
        name  = "NODE_ENV"
        value = var.node_env
      }

      env {
        name  = "LOG_LEVEL"
        value = var.log_level
      }
    }
  }

  tags = {
    Environment = var.node_env
    Project     = "Magnus-Flipper-AI"
  }
}
