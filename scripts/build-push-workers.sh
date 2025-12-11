#!/bin/bash
# Build and push worker images to Azure Container Registry
# Usage: ./scripts/build-push-workers.sh

set -e

ACR_NAME="${ACR_NAME:-magnusacr}"
ACR_LOGIN_SERVER="${ACR_NAME}.azurecr.io"

echo "=========================================="
echo "Building and Pushing Worker Images to ACR"
echo "=========================================="
echo "ACR Name: ${ACR_NAME}"
echo "ACR Login Server: ${ACR_LOGIN_SERVER}"
echo ""

# Login to ACR
echo "1. Logging in to ACR..."
az acr login --name "${ACR_NAME}"

# Build and push worker-realtime
echo ""
echo "2. Building magnus-worker-realtime..."
docker build \
  --platform linux/amd64 \
  -f apps/worker-realtime/Dockerfile \
  -t "${ACR_LOGIN_SERVER}/magnus-worker-realtime:latest" \
  .

echo ""
echo "3. Pushing magnus-worker-realtime..."
docker push "${ACR_LOGIN_SERVER}/magnus-worker-realtime:latest"

# Build and push worker-scheduler
echo ""
echo "4. Building magnus-worker-scheduler..."
docker build \
  --platform linux/amd64 \
  -f apps/worker-scheduler/Dockerfile \
  -t "${ACR_LOGIN_SERVER}/magnus-worker-scheduler:latest" \
  .

echo ""
echo "5. Pushing magnus-worker-scheduler..."
docker push "${ACR_LOGIN_SERVER}/magnus-worker-scheduler:latest"

echo ""
echo "=========================================="
echo "✅ Build and push complete!"
echo "=========================================="
echo ""
echo "Images pushed:"
echo "  - ${ACR_LOGIN_SERVER}/magnus-worker-realtime:latest"
echo "  - ${ACR_LOGIN_SERVER}/magnus-worker-scheduler:latest"
echo ""
echo "Next steps:"
echo "  1. Verify images: ./scripts/verify-acr-images.sh"
echo "  2. Apply Terraform: cd infra/azure && terraform apply"
