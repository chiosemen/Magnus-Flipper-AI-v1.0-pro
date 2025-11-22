#!/bin/bash
set -e

# Magnus Flipper AI - Production Validation Script
# This script validates the Render API + Vercel Frontend integration

echo "🔍 Magnus Flipper AI - Production Validation"
echo "=============================================="
echo ""

API_URL="https://magnus-flipper-api.onrender.com"
USER_AGENT="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test function
test_endpoint() {
  local name="$1"
  local endpoint="$2"
  local expected="$3"

  echo -n "Testing $name... "

  response=$(curl -s -w "\n%{http_code}" -H "User-Agent: $USER_AGENT" "$endpoint" 2>&1)
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')

  if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✓ OK${NC} (HTTP $http_code)"
    if [ -n "$expected" ]; then
      if echo "$body" | grep -q "$expected"; then
        echo "  Response contains: $expected"
      else
        echo -e "  ${YELLOW}⚠ Warning: Expected pattern not found${NC}"
      fi
    fi
    echo "  Response: $body" | head -c 200
    echo ""
  elif [ "$http_code" = "503" ]; then
    echo -e "${YELLOW}⚠ Service Unavailable${NC} (HTTP $http_code)"
    echo "  This might indicate database connection issues"
    echo "  Response: $body"
  else
    echo -e "${RED}✗ FAILED${NC} (HTTP $http_code)"
    echo "  Response: $body"
  fi
  echo ""
}

# Header
echo "📡 Testing Render API endpoints..."
echo ""

# Test 1: Root endpoint
test_endpoint "Root endpoint" "$API_URL/" "Magnus Flipper"

# Test 2: Health check
test_endpoint "Health check" "$API_URL/health" "status"

# Test 3: Deals endpoint (legacy)
test_endpoint "Deals endpoint (legacy)" "$API_URL/api/deals" "deals"

# Test 4: Deals endpoint (v1)
test_endpoint "Deals endpoint (v1)" "$API_URL/api/v1/deals" "deals"

# Test 5: Metrics endpoint
echo -n "Testing Prometheus metrics... "
response=$(curl -s -H "User-Agent: $USER_AGENT" "$API_URL/metrics")
if echo "$response" | grep -q "http_requests_total"; then
  echo -e "${GREEN}✓ OK${NC}"
  echo "  Metrics are being collected"
else
  echo -e "${YELLOW}⚠ Unexpected format${NC}"
fi
echo ""

# Summary
echo "=============================================="
echo "📋 Next Steps:"
echo ""
echo "1. Verify Vercel Environment Variables:"
echo "   cd web && vercel env ls"
echo ""
echo "2. Confirm NEXT_PUBLIC_API_URL is set to:"
echo "   https://magnus-flipper-api.onrender.com"
echo ""
echo "3. Test frontend in browser:"
echo "   - Open browser DevTools → Console"
echo "   - Navigate to your Vercel deployment"
echo "   - Run: console.log(process.env.NEXT_PUBLIC_API_URL)"
echo "   - Expected: https://magnus-flipper-api.onrender.com"
echo ""
echo "4. Check Network tab for API calls:"
echo "   - DevTools → Network → Fetch/XHR"
echo "   - Look for calls to magnus-flipper-api.onrender.com"
echo "   - Verify they return 200 OK"
echo ""
echo "5. Check Render Dashboard:"
echo "   https://dashboard.render.com"
echo "   - All services should show 'Live' status"
echo ""
echo "6. Review full checklist:"
echo "   cat PRODUCTION_VALIDATION.md"
echo ""
echo "=============================================="
