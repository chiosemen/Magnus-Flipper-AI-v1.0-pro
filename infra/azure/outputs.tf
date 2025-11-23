output "resource_group_name" {
  description = "Name of the resource group"
  value       = azurerm_resource_group.rg.name
}

output "acr_login_server" {
  description = "Login server for Azure Container Registry"
  value       = azurerm_container_registry.acr.login_server
}

output "acr_admin_username" {
  description = "Admin username for ACR"
  value       = azurerm_container_registry.acr.admin_username
}

output "acr_admin_password" {
  description = "Admin password for ACR"
  value       = azurerm_container_registry.acr.admin_password
  sensitive   = true
}

output "api_fqdn" {
  description = "Fully qualified domain name of the API"
  value       = azurerm_container_app.api.latest_revision_fqdn
}

output "api_url" {
  description = "Full URL of the API"
  value       = "https://${azurerm_container_app.api.latest_revision_fqdn}"
}

output "redis_hostname" {
  description = "Redis cache hostname"
  value       = azurerm_redis_cache.redis.hostname
}

output "redis_primary_access_key" {
  description = "Redis primary access key"
  value       = azurerm_redis_cache.redis.primary_access_key
  sensitive   = true
}

output "container_app_environment_id" {
  description = "ID of the Container Apps environment"
  value       = azurerm_container_app_environment.ca_env.id
}

output "log_analytics_workspace_id" {
  description = "ID of the Log Analytics workspace"
  value       = azurerm_log_analytics_workspace.logs.id
}
