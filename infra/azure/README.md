# Magnus Flipper AI - Azure Infrastructure

This directory contains Terraform configuration for deploying Magnus Flipper AI to Azure.

## Architecture

- **Azure Container Registry (ACR)**: Stores Docker images for API and workers
- **Azure Container Apps**: Runs the API with autoscaling
- **Azure Container Apps Jobs**: Runs the saved search alerts worker on a cron schedule (every 5 minutes)
- **Azure Cache for Redis**: Message queue and caching layer
- **Log Analytics Workspace**: Centralized logging and monitoring

## Prerequisites

1. Azure CLI installed and authenticated
2. Terraform >= 1.6.0 installed
3. Azure subscription with appropriate permissions
4. Supabase project (or Azure PostgreSQL) for database

## Setup

### 1. Create a `terraform.tfvars` file

```hcl
subscription_id            = "your-azure-subscription-id"
location                   = "eastus"
resource_group_name        = "magnus-rg"
acr_name                   = "magnusacr"
database_url               = "postgresql://user:pass@host:5432/db"
supabase_url               = "https://yourproject.supabase.co"
supabase_anon_key          = "your-anon-key"
supabase_service_role_key  = "your-service-role-key"
jwt_secret                 = "your-jwt-secret"
node_env                   = "production"
```

### 2. Initialize Terraform

```bash
terraform init
```

### 3. Plan the deployment

```bash
terraform plan
```

### 4. Apply the configuration

```bash
terraform apply
```

## Deployment Workflow

The recommended deployment workflow uses GitHub Actions:

1. **Build & Push**: GitHub Actions builds Docker images and pushes to ACR
2. **Deploy**: GitHub Actions updates Container Apps with new images
3. **Verify**: Check logs in Azure Portal

## Managing Resources

### View API logs

```bash
az containerapp logs show \
  --name magnus-api \
  --resource-group magnus-rg \
  --follow
```

### Trigger alerts job manually

```bash
az containerapp job start \
  --name worker-alerts-job \
  --resource-group magnus-rg
```

### View job execution history

```bash
az containerapp job execution list \
  --name worker-alerts-job \
  --resource-group magnus-rg
```

### Update Container App with new image

```bash
az containerapp update \
  --name magnus-api \
  --resource-group magnus-rg \
  --image magnusacr.azurecr.io/magnus-api:latest
```

## Scaling

### Scale API manually

```bash
az containerapp update \
  --name magnus-api \
  --resource-group magnus-rg \
  --min-replicas 2 \
  --max-replicas 10
```

### Configure autoscaling rules

Edit the `azurerm_container_app.api` resource in `main.tf`:

```hcl
template {
  # ...existing config...

  http_scale_rule {
    name                = "http-rule"
    concurrent_requests = 100
  }

  cpu_scale_rule {
    name                     = "cpu-rule"
    cpu_threshold_percentage = 80
  }
}
```

## Cost Optimization

- **Development**: Use `api_min_replicas = 0` to scale to zero when idle
- **Production**: Use `api_min_replicas = 1` for faster response times
- **Redis**: Consider "Basic" tier for development, "Standard" for production

## Monitoring

Access logs and metrics in Azure Portal:
1. Navigate to your Resource Group
2. Select "magnus-api" Container App
3. View "Log stream" or "Metrics"

For alerts worker:
1. Select "worker-alerts-job"
2. View "Execution history"

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

**Warning**: This will delete all Azure resources. Make sure you have backups.

## Troubleshooting

### Container App won't start

Check logs:
```bash
az containerapp logs show --name magnus-api --resource-group magnus-rg --tail 100
```

### Job fails immediately

Check job logs:
```bash
az containerapp job logs show --name worker-alerts-job --resource-group magnus-rg
```

### Image pull errors

Verify ACR credentials:
```bash
az acr credential show --name magnusacr
```

## Additional Resources

- [Azure Container Apps Documentation](https://learn.microsoft.com/en-us/azure/container-apps/)
- [Terraform Azure Provider](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs)

---

## Dry Run Deployment (Local + GitHub Actions)

Before deploying to Azure, you can validate your configuration and monorepo build without making any infrastructure changes.

### Local Dry Run

Run the dry run script from the repository root:

```bash
./scripts/deploy/dry-run.sh
```

This script will:
1. Install dependencies and build the entire monorepo
2. Run `terraform init` to prepare Terraform
3. Run `terraform plan` to preview infrastructure changes
4. **NOT apply any changes** - completely safe to run

### CI Dry Run (GitHub Actions)

The **"Azure Deploy Dry Run"** workflow runs automatically on pull requests to `main`, or you can trigger it manually:

1. Go to **Actions** tab in GitHub
2. Select **"Azure Deploy Dry Run"** workflow
3. Click **"Run workflow"**

This workflow performs the same validation steps as the local script, plus it verifies that all required GitHub Secrets are configured correctly.

**Both dry runs are completely safe** - they only validate your configuration and build process without deploying anything to Azure.
