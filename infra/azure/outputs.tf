# Azure Infrastructure Outputs
# These outputs are used by GitHub Actions and other deployment scripts

output "acr_login_server" {
  value       = data.azurerm_container_registry.acr.login_server
  description = "Azure Container Registry login server URL"
}

output "container_app_environment_id" {
  value       = data.azurerm_container_app_environment.existing.id
  description = "Container Apps Environment ID"
}

output "worker_realtime_name" {
  value       = azurerm_container_app.worker_realtime.name
  description = "Worker Realtime Container App name"
}

output "worker_scheduler_name" {
  value       = azurerm_container_app.worker_scheduler.name
  description = "Worker Scheduler Container App name"
}

output "worker_alerts_name" {
  value       = azurerm_container_app.worker_alerts.name
  description = "Worker Alerts Container App name"
}

output "alerts_worker_fqdn" {
  value       = azurerm_container_app.worker_alerts.latest_revision_fqdn
  description = "Worker Alerts Container App FQDN for health checks"
}

# Note: log_analytics_workspace_id is not available in azurerm_container_app_environment data source
# If needed, query the Log Analytics workspace separately using azurerm_log_analytics_workspace data source
# output "log_analytics_workspace_id" {
#   value       = data.azurerm_container_app_environment.existing.log_analytics_workspace_id
#   description = "Log Analytics Workspace ID for monitoring (from existing Container Apps Environment)"
# }
