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

## Quick Start

### 1. Copy and configure variables

```bash
# Copy the example file
cp terraform.tfvars.example terraform.tfvars

# Edit with your actual values
nano terraform.tfvars
```

**Required values:**
- Azure subscription ID (`az account show --query id -o tsv`)
- Supabase database URL and credentials
- Stripe API keys (from Stripe Dashboard)
- JWT secret (generate with `openssl rand -base64 32`)

See `terraform.tfvars.example` for all available options.

### 2. Initialize Terraform

```bash
terraform init
```

This downloads the Azure provider and prepares the backend.

### 3. Preview changes

```bash
terraform plan
```

Review the resources that will be created (Resource Group, ACR, Redis, Container Apps, etc.)

### 4. Apply the configuration

```bash
terraform apply
```

Type `yes` when prompted. First deployment takes ~5-10 minutes.

### 5. Get outputs

```bash
# View all outputs
terraform output

# Get API URL
terraform output api_url

# Get ACR login server
terraform output acr_login_server
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

## Environment Variables & Secrets

### Adding new environment variables

To add a new environment variable to the API or Worker:

1. **Add the variable to `variables.tf`:**

```hcl
variable "my_new_secret" {
  description = "Description of the secret"
  type        = string
  sensitive   = true  # Mark as sensitive if it's a secret
}
```

2. **Add secret block in `main.tf` (if sensitive):**

```hcl
secret {
  name  = "my-new-secret"
  value = var.my_new_secret
}
```

3. **Add env var to container template in `main.tf`:**

```hcl
env {
  name        = "MY_NEW_SECRET"
  secret_name = "my-new-secret"  # References the secret above
}

# Or for non-sensitive values:
env {
  name  = "MY_CONFIG"
  value = "some-value"
}
```

4. **Update `terraform.tfvars.example`:**

```hcl
my_new_secret = "example-value-change-this"
```

5. **Set the value in your local `terraform.tfvars` and GitHub secrets:**

```bash
# Local
echo 'my_new_secret = "actual-value"' >> terraform.tfvars

# GitHub (for CI/CD)
gh secret set TF_VAR_my_new_secret --body "actual-value"
```

6. **Apply changes:**

```bash
terraform plan
terraform apply
```

### Secret Rotation

To rotate secrets (database passwords, API keys, etc.):

#### Option 1: Update via Terraform (Recommended)

```bash
# 1. Update the value in terraform.tfvars
nano terraform.tfvars

# 2. Apply the change
terraform apply

# 3. Update GitHub secret for CI/CD
gh secret set TF_VAR_database_url --body "new-connection-string"

# 4. Restart containers to pick up new secrets
az containerapp revision restart --name magnus-api --resource-group magnus-rg
```

#### Option 2: Update via Azure CLI (Quick fix)

```bash
# Update secret directly in Container App
az containerapp secret set \
  --name magnus-api \
  --resource-group magnus-rg \
  --secrets database-url="new-value"

# Restart to apply
az containerapp revision restart --name magnus-api --resource-group magnus-rg
```

**⚠️ Important:** Always update both Terraform state and Azure resources to avoid drift.

### Viewing current secrets

```bash
# List all secrets (values are hidden)
az containerapp secret list \
  --name magnus-api \
  --resource-group magnus-rg
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

### Resource Costs (Approximate)

Based on East US region pricing:

| Resource | SKU/Size | Estimated Monthly Cost |
|----------|----------|------------------------|
| Container Apps Environment | Managed | Free |
| API Container App (0.5 vCPU, 1GB) | 24/7 uptime, 1 replica | ~$15-30 |
| Worker Job (0.25 vCPU, 0.5GB) | 288 runs/day @ 5min each | ~$5-10 |
| Azure Cache for Redis | Standard C1 (1GB) | ~$75 |
| Azure Container Registry | Basic | ~$5 |
| Log Analytics Workspace | 5GB ingestion/month | ~$10 |
| **Total (Production)** | | **~$110-130/month** |

### Cost Reduction Strategies

**Development/Staging:**
```hcl
# In terraform.tfvars
api_min_replicas = 0  # Scale to zero when idle
redis_name = "magnus-redis-dev"  # Use Basic tier: ~$15/month
```

**Production:**
```hcl
api_min_replicas = 1  # Keep 1 replica warm (faster cold starts)
api_max_replicas = 3  # Limit max scale
```

**Redis Alternatives:**
- **Basic C0 (250MB)**: ~$15/month - Good for dev/staging
- **Standard C1 (1GB)**: ~$75/month - Recommended for production
- **Standard C2 (2.5GB)**: ~$150/month - High traffic production

### Monitoring Costs

View current spending:
```bash
# Get resource group cost
az consumption usage list --resource-group magnus-rg
```

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
