variable "project_name" {
  type    = string
  default = "magnus-flipper"
}

variable "location" {
  type    = string
  default = "eastus"
}

variable "resource_group_name" {
  type    = string
  default = "magnus-flipper-rg"
}

variable "container_apps_env_name" {
  type    = string
  default = "magnus-flipper-env"
}

variable "acr_name" {
  type    = string
  default = "magnusflipperacr"
}

variable "redis_name" {
  type    = string
  default = "magnusflipperredis"
}

variable "api_image" {
  type        = string
  description = "ACR image for API, e.g. magnusflipperacr.azurecr.io/magnus/api:latest"
}

variable "worker_image" {
  type        = string
  description = "ACR image for worker, e.g. magnusflipperacr.azurecr.io/magnus/worker:latest"
}
