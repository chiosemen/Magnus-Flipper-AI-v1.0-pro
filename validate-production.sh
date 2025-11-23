#!/bin/bash
set -e

# Magnus Flipper AI - Production Validation Script (Azure Container Apps)

echo "🔍 Magnus Flipper AI - Production Validation (Azure)"
echo "===================================================="
echo ""

API_URL="${AZURE_API_URL:-https://your-azure-api.example.com}"
USER_AGENT="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

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

echo "📡 Testing Azure API endpoints..."
echo ""

test_endpoint "Root endpoint" "$API_URL/" "Magnus Flipper"
test_endpoint "Health check" "$API_URL/health" "status"
test_endpoint "Deals endpoint (legacy)" "$API_URL/api/deals" "deals"
test_endpoint "Deals endpoint (v1)" "$API_URL/api/v1/deals" "deals"

echo -n "Testing Prometheus metrics... "
response=$(curl -s -H "User-Agent: $USER_AGENT" "$API_URL/metrics")
if echo "$response" | grep -q "http_requests_total"; then
  echo -e "${GREEN}✓ OK${NC}"
  echo "  Metrics are being collected"
else
  echo -e "${YELLOW}⚠ Unexpected format${NC}"
fi
echo ""

echo "===================================================="
echo "📋 Next Steps:"
echo ""
echo "1. Ensure frontend env points to AZURE_API_URL."
echo "2. Verify Container App ingress FQDN matches AZURE_API_URL."
echo "3. Check API logs in Azure Portal if any test failed."
echo "===================================================="
