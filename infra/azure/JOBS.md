# Azure Container Apps Jobs

## Overview
Magnus Flipper AI uses Azure Container Apps Jobs for background workers and scheduled tasks.

## Jobs Configuration

### 1. Worker Alerts (`worker-alerts-job`)
- **Purpose**: Process saved search alerts and send notifications
- **Schedule**: Every 5 minutes (`*/5 * * * *`)
- **Timeout**: 600 seconds (10 minutes)
- **Resources**: 0.25 CPU, 0.5Gi memory
- **Trigger**: Scheduled

**Environment Variables:**
- `DATABASE_URL` - PostgreSQL connection string (secret)
- `SUPABASE_URL` - Supabase project URL (secret)
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service key (secret)
- `NODE_ENV` - Environment (production/staging)
- `LOG_LEVEL` - Logging level (info/debug/warn/error)

### 2. Worker Crawler (`worker-crawler-job`)
- **Purpose**: Crawl marketplace listings and update data
- **Schedule**: Every 10 minutes (`*/10 * * * *`)
- **Timeout**: 900 seconds (15 minutes)
- **Resources**: 0.5 CPU, 1Gi memory
- **Trigger**: Scheduled

**Environment Variables:**
- `DATABASE_URL` - PostgreSQL connection string (secret)
- `SUPABASE_URL` - Supabase project URL (secret)
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service key (secret)
- `NODE_ENV` - Environment (production/staging)
- `LOG_LEVEL` - Logging level

### 3. Scheduler (`worker-scheduler-job`)
- **Purpose**: Orchestrate and dispatch background tasks
- **Schedule**: Every minute (`* * * * *`)
- **Timeout**: 300 seconds (5 minutes)
- **Resources**: 0.25 CPU, 0.5Gi memory
- **Trigger**: Scheduled

**Environment Variables:**
- `DATABASE_URL` - PostgreSQL connection string (secret)
- `SUPABASE_URL` - Supabase project URL (secret)
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service key (secret)
- `NODE_ENV` - Environment (production/staging)
- `LOG_LEVEL` - Logging level

## Manual Execution

Trigger jobs manually via Azure CLI:

```bash
# Trigger alerts job
az containerapp job start \
  --name worker-alerts-job \
  --resource-group magnus-rg

# Trigger crawler job
az containerapp job start \
  --name worker-crawler-job \
  --resource-group magnus-rg

# Trigger scheduler job
az containerapp job start \
  --name worker-scheduler-job \
  --resource-group magnus-rg
```

## Monitoring

View job execution history:

```bash
# List executions for alerts job
az containerapp job execution list \
  --name worker-alerts-job \
  --resource-group magnus-rg

# View logs for specific execution
az containerapp job logs show \
  --name worker-alerts-job \
  --resource-group magnus-rg \
  --execution <execution-name>
```

## Scaling

Jobs are configured with:
- `parallelism = 1` - One instance at a time
- `replica_completion_count = 1` - Complete once
- `replica_retry_limit = 1` - Retry once on failure

To modify scaling, update the Terraform configuration in `main.tf`.

## Secret Management

All secrets are stored in Azure Container Apps and injected as environment variables. Secrets are never committed to git.

Update secrets via Terraform by modifying `terraform.tfvars` (never commit this file).
