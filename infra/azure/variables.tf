variable "location" {
  type    = string
  default = "eastus"
}

variable "resource_group_name" {
  type    = string
  default = "magnus-rg"
}

variable "acr_name" {
  type    = string
  default = "magnusacr"
}

# Container Apps environment name
variable "cae_name" {
  type    = string
  default = "magnus-ca-env"
}

# Container Apps names
variable "worker_realtime_name" {
  type    = string
  default = "mf-worker-realtime"
}

variable "worker_scheduler_name" {
  type    = string
  default = "mf-worker-scheduler"
}

