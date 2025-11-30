terraform {
  backend "local" {
    path = "infra/terraform/terraform.tfstate"
  }
}
