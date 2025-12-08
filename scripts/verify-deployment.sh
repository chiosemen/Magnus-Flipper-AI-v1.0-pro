#!/bin/bash

# Magnus Flipper Deployment Verification Script
# Run this BEFORE and AFTER deploying to Vercel

set -e

echo "🔍 MAGNUS FLIPPER DEPLOYMENT VERIFICATION"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0

# Function to check and report
check() {
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} $1"
  else
    echo -e "${RED}✗${NC} $1"
    ((ERRORS++))
  fi
}

echo "📁 PART 1: Configuration Files"
echo "--------------------------------"

# Check vercel.json exists at root
[ -f "vercel.json" ]
check "Root vercel.json exists"

# Check apps/web/vercel.json exists
[ -f "apps/web/vercel.json" ]
check "apps/web/vercel.json exists"

# Check next.config.mjs has turbopack
grep -q "turbo:" apps/web/next.config.mjs
check "next.config.mjs has turbopack config"

# Check no output: 'export' in next.config (should be undefined or not 'export')
if grep -q "output:\s*['\"]export['\"]" apps/web/next.config.mjs 2>/dev/null; then
  echo -e "${RED}✗${NC} next.config.mjs IS set to static export"
  ((ERRORS++))
else
  echo -e "${GREEN}✓${NC} next.config.mjs NOT set to static export"
fi

echo ""
echo "🔒 PART 2: Dynamic Rendering Configs"
echo "------------------------------------"

# Check page.tsx has force-dynamic
grep -q 'export const dynamic = "force-dynamic"' apps/web/app/page.tsx
check "page.tsx has force-dynamic"

# Check layout.tsx has force-dynamic
grep -q 'export const dynamic = "force-dynamic"' apps/web/app/layout.tsx
check "layout.tsx has force-dynamic"

# Check marketplaces page has force-dynamic
grep -q 'export const dynamic = "force-dynamic"' apps/web/app/marketplaces/page.tsx
check "marketplaces/page.tsx has force-dynamic"

# Check API route has force-dynamic
grep -q 'export const dynamic = "force-dynamic"' apps/web/app/api/opportunities/live/route.ts
check "API route has force-dynamic"

echo ""
echo "📦 PART 3: Import Paths (No Aliases)"
echo "------------------------------------"

# Check no @swoopa aliases in app
! grep -r "@swoopa" apps/web/app/ 2>/dev/null
check "No @swoopa aliases in app/"

# Check page.tsx uses relative import
grep -q 'from "../marketing-swoopa' apps/web/app/page.tsx
check "page.tsx uses relative import"

# Check layout.tsx uses relative import
grep -q 'from "../marketing-swoopa' apps/web/app/layout.tsx
check "layout.tsx uses relative import"

echo ""
echo "🎨 PART 4: CSS Configuration"
echo "----------------------------"

# Check globals.css doesn't exist
[ ! -f "apps/web/app/globals.css" ]
check "globals.css deleted"

# Check old marketing.css doesn't exist
[ ! -f "apps/web/app/marketing.css" ]
check "old marketing.css deleted"

# Check marketing-swoopa/marketing.css exists
[ -f "apps/web/marketing-swoopa/marketing.css" ]
check "marketing-swoopa/marketing.css exists"

echo ""
echo "🧩 PART 5: Marketing Components"
echo "-------------------------------"

# Check all components have "use client"
TOTAL_COMPONENTS=$(ls apps/web/marketing-swoopa/components/*.tsx 2>/dev/null | wc -l)
CLIENT_COMPONENTS=$(grep -l '"use client"' apps/web/marketing-swoopa/components/*.tsx 2>/dev/null | wc -l)

if [ "$TOTAL_COMPONENTS" -eq "$CLIENT_COMPONENTS" ]; then
  echo -e "${GREEN}✓${NC} All $TOTAL_COMPONENTS components have 'use client'"
else
  echo -e "${RED}✗${NC} Only $CLIENT_COMPONENTS/$TOTAL_COMPONENTS components have 'use client'"
  ((ERRORS++))
fi

echo ""
echo "🗂️ PART 6: Clean .vercel Folders"
echo "--------------------------------"

# Check no .vercel in apps/web
[ ! -d "apps/web/.vercel" ]
check "No .vercel in apps/web/"

# Check no .vercel in apps/api
[ ! -d "apps/api/.vercel" ]
check "No .vercel in apps/api/"

echo ""
echo "=========================================="

if [ $ERRORS -eq 0 ]; then
  echo -e "${GREEN}🎉 ALL CHECKS PASSED!${NC}"
  echo ""
  echo "Your Magnus Flipper repo is ready for deployment!"
  echo ""
  echo "Next steps:"
  echo "  1. cd $(pwd)"
  echo "  2. vercel link --yes"
  echo "  3. vercel --prod --force"
  exit 0
else
  echo -e "${RED}❌ $ERRORS ERROR(S) FOUND${NC}"
  echo ""
  echo "Please fix the errors above before deploying."
  exit 1
fi
