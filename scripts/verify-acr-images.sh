#!/bin/bash
# Verify worker images exist in Azure Container Registry
# Usage: ./scripts/verify-acr-images.sh

set -e

ACR_NAME="${ACR_NAME:-magnusacr}"

echo "=========================================="
echo "Verifying Worker Images in ACR"
echo "=========================================="
echo "ACR Name: ${ACR_NAME}"
echo ""

# Check worker-realtime
echo "1. Checking magnus-worker-realtime repository..."
if az acr repository show --name "${ACR_NAME}" --repository magnus-worker-realtime &>/dev/null; then
  echo "   ✅ Repository exists"
  echo ""
  echo "   Tags:"
  az acr repository show-tags \
    --name "${ACR_NAME}" \
    --repository magnus-worker-realtime \
    --output table
else
  echo "   ❌ Repository does not exist"
fi

echo ""

# Check worker-scheduler
echo "2. Checking magnus-worker-scheduler repository..."
if az acr repository show --name "${ACR_NAME}" --repository magnus-worker-scheduler &>/dev/null; then
  echo "   ✅ Repository exists"
  echo ""
  echo "   Tags:"
  az acr repository show-tags \
    --name "${ACR_NAME}" \
    --repository magnus-worker-scheduler \
    --output table
else
  echo "   ❌ Repository does not exist"
fi

echo ""
echo "=========================================="
echo "Verification complete!"
echo "=========================================="
