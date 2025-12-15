#!/bin/bash
# Azure deployment script for Container Apps and Redis
# Usage: ./deploy.sh <subscription-id>

set -e

SUBSCRIPTION_ID=${1:-""}
RESOURCE_GROUP="magnus-rg"
LOCATION="eastus"
REDIS_NAME="magnus-redis"
ENV_NAME="magnus-env"

if [ -z "$SUBSCRIPTION_ID" ]; then
  echo "Usage: ./deploy.sh <subscription-id>"
  exit 1
fi

echo "🔧 Setting subscription..."
az account set --subscription "$SUBSCRIPTION_ID"

echo "📦 Creating resource group..."
az group create --name "$RESOURCE_GROUP" --location "$LOCATION" || true

echo "🔴 Creating Azure Cache for Redis..."
az redis create \
  --name "$REDIS_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --location "$LOCATION" \
  --sku Basic \
  --vm-size c0 || echo "Redis may already exist"

echo "🔑 Getting Redis connection details..."
REDIS_HOST=$(az redis show --name "$REDIS_NAME" --resource-group "$RESOURCE_GROUP" --query "hostName" -o tsv)
REDIS_PORT=$(az redis show --name "$REDIS_NAME" --resource-group "$RESOURCE_GROUP" --query "port" -o tsv)
REDIS_PASSWORD=$(az redis list-keys --name "$REDIS_NAME" --resource-group "$RESOURCE_GROUP" --query "primaryKey" -o tsv)

echo "📝 Redis connection info:"
echo "  Host: $REDIS_HOST"
echo "  Port: $REDIS_PORT"
echo "  Password: [hidden]"

echo "🌐 Creating Container App environment..."
az containerapp env create \
  --name "$ENV_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --location "$LOCATION" || echo "Environment may already exist"

echo "🚀 Deploying worker-ingest..."
az containerapp create \
  --resource-group "$RESOURCE_GROUP" \
  --name worker-ingest \
  --environment "$ENV_NAME" \
  --image ghcr.io/chiosemen/magnus-worker-ingest:latest \
  --cpu 1 \
  --memory 2Gi \
  --min-replicas 1 \
  --max-replicas 5 \
  --env-vars \
    REDIS_HOST="$REDIS_HOST" \
    REDIS_PORT="$REDIS_PORT" \
    REDIS_PASSWORD="$REDIS_PASSWORD" \
    REDIS_TLS="false" \
    WORKER_CONCURRENCY="10" \
    FB_BATCH_CONCURRENCY="2" \
    NODE_ENV="production" || echo "worker-ingest may already exist"

echo "⏰ Deploying worker-scheduler..."
az containerapp create \
  --resource-group "$RESOURCE_GROUP" \
  --name worker-scheduler \
  --environment "$ENV_NAME" \
  --image ghcr.io/chiosemen/magnus-worker-scheduler:latest \
  --cpu 0.5 \
  --memory 1Gi \
  --min-replicas 1 \
  --max-replicas 1 \
  --env-vars \
    REDIS_HOST="$REDIS_HOST" \
    REDIS_PORT="$REDIS_PORT" \
    REDIS_PASSWORD="$REDIS_PASSWORD" \
    REDIS_TLS="false" \
    SCHEDULER_TICK_MS="60000" \
    NODE_ENV="production" || echo "worker-scheduler may already exist"

echo "✅ Deployment complete!"
echo ""
echo "📊 Check status:"
echo "  az containerapp logs show --name worker-ingest --resource-group $RESOURCE_GROUP --follow"
echo "  az containerapp logs show --name worker-scheduler --resource-group $RESOURCE_GROUP --follow"
