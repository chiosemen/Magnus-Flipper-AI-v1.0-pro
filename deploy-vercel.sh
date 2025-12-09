#!/bin/bash

# Vercel Deployment Script
# Magnus Build Surgeon - Vercel Fix Deployment

set -e

echo "🚀 Magnus Vercel Deployment Script"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "vercel.json" ]; then
    echo -e "${RED}❌ Error: vercel.json not found. Please run from project root.${NC}"
    exit 1
fi

echo -e "${YELLOW}📦 Step 1: Building web app...${NC}"
pnpm --filter web build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build successful!${NC}"
echo ""

echo -e "${YELLOW}🚀 Step 2: Deploying to Vercel...${NC}"
vercel --prod --cwd apps/web --force

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Deployment failed!${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Check Vercel dashboard for deployment status"
echo "2. Verify build logs for any warnings"
echo "3. Test the deployed application"
