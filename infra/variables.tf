variable "project_name" {
  type    = string
  default = "magnus-mvp"
}

variable "location" {
  type    = string
  default = "eastus"
}

variable "resource_group_name" {
  type = string
}

variable "acr_name" {
  type    = string
  default = "MagnusACR"
}

variable "containerapps_env_name" {
  type    = string
  default = "magnus-env"
}

variable "redis_name" {
  type    = string
  default = "magnus-redis"
}

variable "api_image" {
  type = string
}

variable "worker_image" {
  type = string
}
