output "api_fqdn" {
  value = azurerm_container_app.api.latest_revision_fqdn
}

output "redis_hostname" {
  value = azurerm_redis_cache.redis.hostname
}
