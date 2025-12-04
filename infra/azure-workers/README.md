# Azure Workers Deployment Guide

This directory contains Dockerfiles and Azure Container App manifests for all workers.

## Workers

- **worker-scraper**: Marketplace scraping worker
- **worker-tracker**: Shipment tracking worker
- **worker-autosell**: Auto-sell detection and finalization worker

## Building Images

### Prerequisites

- Docker installed
- Azure CLI installed and logged in
- Azure Container Registry created

### Build Commands

```bash
# Set registry
export AZURE_CONTAINER_REGISTRY=your-registry.azurecr.io

# Build worker-scraper
docker build -t $AZURE_CONTAINER_REGISTRY/worker-scraper:latest \
  -f infra/azure-workers/worker-scraper/Dockerfile .

# Build worker-tracker
docker build -t $AZURE_CONTAINER_REGISTRY/worker-tracker:latest \
  -f infra/azure-workers/worker-tracker/Dockerfile .

# Build worker-autosell
docker build -t $AZURE_CONTAINER_REGISTRY/worker-autosell:latest \
  -f infra/azure-workers/worker-autosell/Dockerfile .
```

## Pushing to Registry

```bash
# Login to ACR
az acr login --name your-registry

# Push images
docker push $AZURE_CONTAINER_REGISTRY/worker-scraper:latest
docker push $AZURE_CONTAINER_REGISTRY/worker-tracker:latest
docker push $AZURE_CONTAINER_REGISTRY/worker-autosell:latest
```

## Deploying to Azure Container Apps

### Prerequisites

- Azure Container App environment created
- Resource group created
- Container Registry configured

### Deployment Steps

1. **Update manifests** with your values:
   - Replace `{subscription-id}`
   - Replace `{resource-group}`
   - Replace `{env-name}`
   - Replace `{registry}`

2. **Create secrets** in Container App environment:
   ```bash
   az containerapp env secret set \
     --name your-env-name \
     --resource-group your-resource-group \
     --secrets supabase-url="https://xxxxx.supabase.co" \
                supabase-service-role-key="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   ```

3. **Deploy Container Apps**:
   ```bash
   # Deploy worker-scraper
   az containerapp create \
     --name worker-scraper \
     --resource-group your-resource-group \
     --environment your-env-name \
     --image your-registry.azurecr.io/worker-scraper:latest \
     --target-port 8080 \
     --min-replicas 1 \
     --max-replicas 5
   
   # Deploy worker-tracker
   az containerapp create \
     --name worker-tracker \
     --resource-group your-resource-group \
     --environment your-env-name \
     --image your-registry.azurecr.io/worker-tracker:latest \
     --target-port 8080 \
     --min-replicas 1 \
     --max-replicas 3
   
   # Deploy worker-autosell
   az containerapp create \
     --name worker-autosell \
     --resource-group your-resource-group \
     --environment your-env-name \
     --image your-registry.azurecr.io/worker-autosell:latest \
     --target-port 8080 \
     --min-replicas 1 \
     --max-replicas 3
   ```

## Environment Variables

Each worker requires:

- `NODE_ENV=production`
- `SUPABASE_URL` (from secret)
- `SUPABASE_SERVICE_ROLE_KEY` (from secret)
- `WORKER_ID` (optional, defaults to worker name)
- `WORKER_HEARTBEAT_INTERVAL` (optional, defaults to 60000ms)

## Scaling

Configured in `azure-containerapp.yaml`:

- **worker-scraper**: 1-5 replicas
- **worker-tracker**: 1-3 replicas
- **worker-autosell**: 1-3 replicas

## Health Checks

All workers expose `/health` endpoint on port 8080:

- **Liveness probe**: Checks if container is alive
- **Readiness probe**: Checks if container is ready to serve traffic

## Monitoring

Monitor workers via:

- Azure Container Apps dashboard
- Application Insights (if configured)
- Supabase `worker_logs` table

---

**END OF AZURE WORKERS DEPLOYMENT GUIDE**

