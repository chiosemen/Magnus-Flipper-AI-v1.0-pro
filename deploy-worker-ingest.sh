#!/usr/bin/env bash
set -e

echo "🧹 Step 0: Sanity check"
cd apps/worker-ingest
if [ ! -f dist/worker.js ]; then
  echo "❌ dist/worker.js missing. Run pnpm run build first."
  exit 1
fi
cd ../../

echo "🐳 Step 1: Build + push Docker image (linux/amd64)"
docker buildx build \
  --platform linux/amd64 \
  -f apps/worker-ingest/Dockerfile \
  -t magnusacr.azurecr.io/worker-ingest:latest \
  --push .

echo "☁️ Step 2: Update Container App image"
az containerapp update \
  --name worker-ingest \
  --resource-group magnus-workers-rg \
  --image magnusacr.azurecr.io/worker-ingest:latest

echo "🔁 Step 3: Restart active revision"
REVISION=$(az containerapp revision list \
  --name worker-ingest \
  --resource-group magnus-workers-rg \
  --query "[?active==\`true\`].name" \
  -o tsv)

az containerapp revision restart \
  --name worker-ingest \
  --resource-group magnus-workers-rg \
  --revision "$REVISION"

echo "📜 Step 4: Follow logs (Ctrl+C to stop)"
az containerapp logs show \
  --name worker-ingest \
  --resource-group magnus-workers-rg \
  --follow

