terraform {
  required_version = ">= 1.6.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.113"
    }
  }

  # Optional: Configure remote state storage
  # Uncomment and configure these values to use Azure Storage for remote state
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
