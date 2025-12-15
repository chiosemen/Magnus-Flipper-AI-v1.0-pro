# Azure Container Apps Deployment Guide

This guide walks through deploying the `worker-ingest` BullMQ worker to Azure Container Apps.

## Architecture

```
Vercel (UI + API routes)
  ↓ POST /api/ingest/run
Upstash Redis (queue)
  ↓ BullMQ jobs
Azure Container Apps (worker-ingest)
  ↓ Processes jobs
Scrapers (HTML + Playwright)
```

## Prerequisites

- Azure subscription
- Azure CLI installed (`az`)
- Upstash Redis URL (already configured in Vercel)
- Docker (for local testing, optional)

## Deployment Steps

### Step 1: Create Resource Group

```bash
az group create \
  --name magnus-workers-rg \
  --location eastus
```

### Step 2: Create Azure Container Registry

```bash
az acr create \
  --resource-group magnus-workers-rg \
  --name magnusworkersacr \
  --sku Basic
```

**Note:** ACR name must be globally unique. If `magnusworkersacr` is taken, choose a different name.

### Step 3: Login to ACR

```bash
az acr login --name magnusworkersacr
```

### Step 4: Build and Push Image

From the repository root:

```bash
az acr build \
  --registry magnusworkersacr \
  --image worker-ingest:latest \
  --file apps/worker-ingest/Dockerfile \
  .
```

This will:
- Build the Docker image using the Dockerfile
- Install all dependencies including Playwright browsers
- Build the worker TypeScript code
- Push the image to ACR

### Step 5: Create Container Apps Environment

```bash
az containerapp env create \
  --name magnus-worker-env \
  --resource-group magnus-workers-rg \
  --location eastus
```

### Step 6: Get ACR Credentials

```bash
ACR_USERNAME=$(az acr credential show -n magnusworkersacr --query username -o tsv)
ACR_PASSWORD=$(az acr credential show -n magnusworkersacr --query passwords[0].value -o tsv)
```

### Step 7: Deploy Container App

**Important:** Replace `<UPSTASH_TOKEN>` with your actual Upstash Redis token from Vercel environment variables.

```bash
az containerapp create \
  --name magnus-worker-ingest \
  --resource-group magnus-workers-rg \
  --environment magnus-worker-env \
  --image magnusworkersacr.azurecr.io/worker-ingest:latest \
  --registry-server magnusworkersacr.azurecr.io \
  --registry-username "$ACR_USERNAME" \
  --registry-password "$ACR_PASSWORD" \
  --env-vars \
    REDIS_URL="redis://default:<UPSTASH_TOKEN>@hip-platypus-20977.upstash.io:6379" \
    NODE_ENV=production \
    INGEST_CONCURRENCY=10 \
    FB_BATCH_CONCURRENCY=2 \
    PLAYWRIGHT_HEADLESS=true \
  --cpu 0.5 \
  --memory 1.0Gi \
  --min-replicas 1 \
  --max-replicas 3 \
  --ingress external=false
```

**Key Configuration:**
- `--ingress external=false`: Worker doesn't need HTTP ingress (pure background processor)
- `--min-replicas 1`: Always keep one worker running
- `--max-replicas 3`: Scale up to 3 workers if queue depth increases
- `--cpu 0.5 --memory 1.0Gi`: Cost-effective resource allocation

### Step 8: Verify Deployment

Check worker logs:

```bash
az containerapp logs show \
  --name magnus-worker-ingest \
  --resource-group magnus-workers-rg \
  --follow
```

**Expected output:**
```
🚀 Starting ingestion worker...
Concurrency: 10
Facebook batch concurrency: 2
[BullMQ] Worker initialized
[BullMQ] Listening for jobs...
```

## Testing End-to-End

1. **Open your Vercel app** (deployed at your Vercel domain)
2. **Navigate to MM Agent page** (`/mm-agent`)
3. **Enter a search query** (e.g., "iphone 16")
4. **Click "Search Marketplace"**
5. **Monitor Azure logs:**
   ```bash
   az containerapp logs show \
     --name magnus-worker-ingest \
     --resource-group magnus-workers-rg \
     --follow
   ```
6. **Verify listings appear** in the UI

## Monitoring Queue

Connect to Upstash Redis to monitor queue:

```bash
redis-cli -u redis://default:<UPSTASH_TOKEN>@hip-platypus-20977.upstash.io:6379
```

Then check queue status:
```redis
KEYS bull:ingest:*
LLEN bull:ingest:waiting
HGETALL ingest:<jobId>:status
```

## Updating the Worker

To update the worker after code changes:

1. **Rebuild and push image:**
   ```bash
   az acr build \
     --registry magnusworkersacr \
     --image worker-ingest:latest \
     --file apps/worker-ingest/Dockerfile \
     .
   ```

2. **Update Container App:**
   ```bash
   az containerapp update \
     --name magnus-worker-ingest \
     --resource-group magnus-workers-rg \
     --image magnusworkersacr.azurecr.io/worker-ingest:latest
   ```

Azure Container Apps will automatically:
- Pull the new image
- Create a new revision
- Switch traffic to the new revision
- Keep old revision for rollback

## Troubleshooting

### Worker Not Processing Jobs

1. **Check logs:**
   ```bash
   az containerapp logs show \
     --name magnus-worker-ingest \
     --resource-group magnus-workers-rg \
     --follow
   ```

2. **Verify Redis connection:**
   - Check REDIS_URL is correct
   - Verify Upstash Redis is accessible
   - Check for connection errors in logs

3. **Verify queue has jobs:**
   ```bash
   redis-cli -u redis://default:<TOKEN>@hip-platypus-20977.upstash.io:6379
   > KEYS bull:ingest:*
   ```

### Playwright Errors

If you see Playwright browser errors:

1. **Verify browsers are installed:**
   - Check Dockerfile includes `npx playwright install chromium`
   - Rebuild image if needed

2. **Check system dependencies:**
   - Dockerfile should include all Playwright system dependencies
   - See Dockerfile for full list

### High Memory Usage

If worker is using too much memory:

1. **Reduce concurrency:**
   ```bash
   az containerapp update \
     --name magnus-worker-ingest \
     --resource-group magnus-workers-rg \
     --set-env-vars INGEST_CONCURRENCY=5
   ```

2. **Increase memory:**
   ```bash
   az containerapp update \
     --name magnus-worker-ingest \
     --resource-group magnus-workers-rg \
     --memory 2.0Gi
   ```

## Cost Estimation

- **Container Apps:** ~$0.000012/second per container (0.5 CPU, 1.0Gi memory)
- **ACR Basic:** ~$5/month (first 10GB free)
- **Total:** ~$8-15/month for one always-on worker

Scaling to 3 replicas during peak times: ~$24-45/month

## Security Best Practices

1. **Use Azure Key Vault for secrets:**
   - Store REDIS_URL in Key Vault
   - Reference from Container Apps secrets

2. **Private ACR:**
   - Consider enabling ACR private endpoints
   - Restrict access to Container Apps only

3. **Network isolation:**
   - Worker has no public ingress (already configured)
   - Only outbound connections to Upstash Redis

## Next Steps

After successful deployment:

1. Monitor worker logs for first few jobs
2. Verify job processing completes successfully
3. Check UI shows listings correctly
4. Set up Azure Monitor alerts for worker health
5. Consider adding dead-letter queue handling
