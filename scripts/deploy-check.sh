#!/usr/bin/env bash
set -euo pipefail

echo "====== Magnus Flipper AI - Deployment Check ======"
echo ""

# Colors
GREEN='\033[0.32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "Step 1: Installing dependencies..."
export PUPPETEER_SKIP_DOWNLOAD=true
pnpm install --frozen-lockfile

echo ""
echo "Step 2: Building all packages and apps..."
pnpm build

echo ""
echo "Step 3: Checking dist directories..."
MISSING=0

for app in api scheduler worker-crawler worker-analyzer worker-alerts bot-telegram; do
  if [ ! -d "apps/$app/dist" ]; then
    echo -e "${RED}✗ Missing: apps/$app/dist${NC}"
    MISSING=$((MISSING + 1))
  else
    echo -e "${GREEN}✓ Found: apps/$app/dist${NC}"
  fi
done

if [ $MISSING -gt 0 ]; then
  echo ""
  echo -e "${RED}❌ Deployment check FAILED: $MISSING missing dist directories${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}✅ Deployment check PASSED${NC}"
echo ""
echo "All packages built successfully!"
echo "Ready to deploy to Render."
