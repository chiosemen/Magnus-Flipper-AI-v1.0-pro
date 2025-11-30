output "containerapps_environment_id" {
  description = "ID of the Container Apps environment"
  value       = azurerm_container_app_environment.env.id
}

output "api_fqdn" {
  description = "Public FQDN of the API container app"
  value       = azurerm_container_app.api.latest_revision_fqdn
}

output "redis_hostname" {
  description = "Hostname of the Redis cache"
  value       = azurerm_redis_cache.redis.hostname
}

output "acr_login_server" {
  description = "ACR login server"
  value       = data.azurerm_container_registry.acr.login_server
}
