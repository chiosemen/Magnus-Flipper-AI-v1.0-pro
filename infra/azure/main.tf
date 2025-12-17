# Use existing RG
data "azurerm_resource_group" "prod" {
  name = var.resource_group_name
}

# Use existing ACR
data "azurerm_container_registry" "acr" {
  name                = var.acr_name
  resource_group_name = data.azurerm_resource_group.prod.name
}

# Use existing Container Apps Environment
# The environment already exists and has Log Analytics configured
data "azurerm_container_app_environment" "existing" {
  name                = var.cae_name
  resource_group_name = data.azurerm_resource_group.prod.name
}

# ========== WORKER: REALTIME SCRAPERS ==========

resource "azurerm_container_app" "worker_realtime" {
  name                         = var.worker_realtime_name
  container_app_environment_id = data.azurerm_container_app_environment.existing.id
  resource_group_name          = data.azurerm_resource_group.prod.name
  revision_mode                = "Single"

  template {
    container {
      name  = "worker-realtime"
      image = "${data.azurerm_container_registry.acr.login_server}/magnus-worker-realtime:latest"

      cpu    = 0.5
      memory = "1Gi"

      env {
        name  = "NODE_ENV"
        value = "production"
      }

      # Add your real envs later (Supabase, queues, etc)
      # env {
      #   name  = "SUPABASE_URL"
      #   value = ""
      # }
    }

    min_replicas = 1
    max_replicas = 3
  }

  ingress {
    external_enabled = false
    target_port      = 3000
    transport        = "auto"

    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }

  registry {
    server   = data.azurerm_container_registry.acr.login_server
    identity = "System"
  }

  identity {
    type = "SystemAssigned"
  }
}

# ========== WORKER: SCHEDULER / CRON ==========

resource "azurerm_container_app" "worker_scheduler" {
  name                         = var.worker_scheduler_name
  container_app_environment_id = data.azurerm_container_app_environment.existing.id
  resource_group_name          = data.azurerm_resource_group.prod.name
  revision_mode                = "Single"

  template {
    container {
      name  = "worker-scheduler"
      image = "${data.azurerm_container_registry.acr.login_server}/magnus-worker-scheduler:latest"

      cpu    = 0.25
      memory = "0.5Gi"

      env {
        name  = "NODE_ENV"
        value = "production"
      }
    }

    min_replicas = 1
    max_replicas = 1
  }

  ingress {
    external_enabled = false
    target_port      = 3000
    transport        = "auto"

    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }

  registry {
    server   = data.azurerm_container_registry.acr.login_server
    identity = "System"
  }

  identity {
    type = "SystemAssigned"
  }

  # NOTE: you can later attach a Dapr component or Azure Timer logic if using Jobs
}

# ========== WORKER: ALERTS MONITORING ==========

resource "azurerm_container_app" "worker_alerts" {
  name                         = var.worker_alerts_name
  container_app_environment_id = data.azurerm_container_app_environment.existing.id
  resource_group_name          = data.azurerm_resource_group.prod.name
  revision_mode                = "Single"

  template {
    container {
      name  = "worker-alerts"
      image = "${data.azurerm_container_registry.acr.login_server}/magnus-worker-alerts:latest"

      cpu    = 0.25
      memory = "0.5Gi"

      env {
        name  = "NODE_ENV"
        value = "production"
      }

      # Poll interval (30s default)
      env {
        name  = "ALERTS_POLL_INTERVAL_MS"
        value = "30000"
      }

      # ML provider (optional: "openai", "deepseek", or "none")
      env {
        name  = "ML_ALERTS_PROVIDER"
        value = "none"
      }

      # Add your real envs later (Supabase, ML API keys, etc)
      # env {
      #   name  = "SUPABASE_URL"
      #   value = ""
      # }
      # env {
      #   name  = "DATABASE_URL"
      #   value = ""
      # }
      # env {
      #   name  = "OPENAI_API_KEY"
      #   secretRef = "openai-api-key"
      # }
      # env {
      #   name  = "DEEPSEEK_API_KEY"
      #   secretRef = "deepseek-api-key"
      # }
    }

    min_replicas = 1
    max_replicas = 1
  }

  ingress {
    external_enabled = true
    target_port      = 3000
    transport        = "http"

    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }

  registry {
    server   = data.azurerm_container_registry.acr.login_server
    identity = "System"
  }

  identity {
    type = "SystemAssigned"
  }
}
