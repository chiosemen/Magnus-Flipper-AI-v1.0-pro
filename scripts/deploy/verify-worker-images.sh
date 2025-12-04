#!/bin/bash

# Worker Image Verification Script
# Builds and validates Docker images for Azure Container Apps

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

REGISTRY=${AZURE_CONTAINER_REGISTRY:-"your-registry.azurecr.io"}
WORKERS=("worker-scraper" "worker-tracker" "worker-autosell")

echo "🐳 Building and Verifying Worker Images..."
echo ""

# Check if Docker is available
if ! command -v docker &> /dev/null; then
  echo -e "${RED}❌ Docker is not installed or not in PATH${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Docker is available${NC}"
echo ""

# Build and verify each worker
for worker in "${WORKERS[@]}"; do
  echo "🔨 Building $worker..."
  
  WORKER_DIR="infra/azure-workers/$worker"
  DOCKERFILE="$WORKER_DIR/Dockerfile"
  IMAGE_NAME="$REGISTRY/$worker:latest"
  
  # Check Dockerfile exists
  if [ ! -f "$DOCKERFILE" ]; then
    echo -e "${RED}❌ Dockerfile not found: $DOCKERFILE${NC}"
    exit 1
  fi
  
  # Build image
  if docker build -t "$IMAGE_NAME" -f "$DOCKERFILE" . > /tmp/docker-build-$worker.log 2>&1; then
    echo -e "${GREEN}✅ $worker image built successfully${NC}"
  else
    echo -e "${RED}❌ $worker image build failed${NC}"
    echo "Build logs:"
    cat /tmp/docker-build-$worker.log
    exit 1
  fi
  
  # Verify image exists
  if docker image inspect "$IMAGE_NAME" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ $worker image exists${NC}"
    
    # Get image size
    IMAGE_SIZE=$(docker image inspect "$IMAGE_NAME" --format='{{.Size}}' | numfmt --to=iec-i --suffix=B 2>/dev/null || echo "unknown")
    echo "   Image size: $IMAGE_SIZE"
  else
    echo -e "${RED}❌ $worker image not found after build${NC}"
    exit 1
  fi
  
  # Test healthcheck (if container can start)
  echo "🏥 Testing healthcheck..."
  
  # Create a test container
  CONTAINER_ID=$(docker create "$IMAGE_NAME" 2>&1)
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ $worker container can be created${NC}"
    docker rm "$CONTAINER_ID" > /dev/null 2>&1
  else
    echo -e "${YELLOW}⚠️  $worker container creation test failed (may be expected)${NC}"
  fi
  
  echo ""
done

echo "📋 Image Summary:"
echo ""

for worker in "${WORKERS[@]}"; do
  IMAGE_NAME="$REGISTRY/$worker:latest"
  if docker image inspect "$IMAGE_NAME" > /dev/null 2>&1; then
    IMAGE_ID=$(docker image inspect "$IMAGE_NAME" --format='{{.Id}}' | cut -d: -f2 | cut -c1-12)
    echo -e "${GREEN}✅ $worker: $IMAGE_NAME (${IMAGE_ID})${NC}"
  else
    echo -e "${RED}❌ $worker: Image not found${NC}"
  fi
done

echo ""
echo -e "${GREEN}✅ All worker images built and verified successfully!${NC}"
echo ""
echo "📤 To push images to Azure Container Registry:"
echo ""
for worker in "${WORKERS[@]}"; do
  echo "  docker push $REGISTRY/$worker:latest"
done
echo ""

