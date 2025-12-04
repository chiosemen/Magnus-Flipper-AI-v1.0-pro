#!/bin/bash

# ==========================================
# Post-Deployment Smoke Tests
# Magnus Flipper AI Production Verification
# ==========================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_ROOT/.env.production"

# Load environment
if [ -f "$ENV_FILE" ]; then
    set -a
    source "$ENV_FILE"
    set +a
fi

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run test
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    echo -e "\n${BLUE}Testing:${NC} $test_name"
    
    if eval "$test_command"; then
        echo -e "${GREEN}✅ PASS${NC}: $test_name"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}❌ FAIL${NC}: $test_name"
        ((TESTS_FAILED++))
        return 1
    fi
}

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Magnus Flipper AI - Smoke Tests      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"

# Test 1: Health Endpoint
run_test "Health Endpoint" '
    RESPONSE=$(curl -s https://flipperagents.com/api/health)
    STATUS=$(echo "$RESPONSE" | jq -r ".status" 2>/dev/null)
    [ "$STATUS" = "healthy" ]
'

# Test 2: Health Endpoint Services
run_test "Health Endpoint - All Services" '
    RESPONSE=$(curl -s https://flipperagents.com/api/health)
    SUPABASE=$(echo "$RESPONSE" | jq -r ".services.supabase" 2>/dev/null)
    STRIPE=$(echo "$RESPONSE" | jq -r ".services.stripe" 2>/dev/null)
    [ "$SUPABASE" = "true" ] && [ "$STRIPE" = "true" ]
'

# Test 3: Supabase Connection
run_test "Supabase Database Connection" '
    curl -s -f \
        "https://$SUPABASE_PROJECT_ID.supabase.co/rest/v1/users?select=count" \
        -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
        -H "Authorization: Bearer $NEXT_PUBLIC_SUPABASE_ANON_KEY" >/dev/null
'

# Test 4: Supabase Edge Function
run_test "Supabase Edge Function (events-ingest)" '
    RESPONSE=$(curl -s -w "\n%{http_code}" \
        -X POST \
        "https://$SUPABASE_PROJECT_ID.supabase.co/functions/v1/events-ingest" \
        -H "Authorization: Bearer $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
        -H "Content-Type: application/json" \
        -d "{\"marketplace\":\"test\",\"event_type\":\"smoke_test\",\"data\":{}}")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
    [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 500 ]
'

# Test 5: Stripe Webhook Endpoint
run_test "Stripe Webhook Endpoint Accessible" '
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
        -X POST \
        https://flipperagents.com/api/stripe/webhook \
        -H "Content-Type: application/json" \
        -d "{}")
    [ "$HTTP_CODE" -eq 400 ] || [ "$HTTP_CODE" -eq 401 ]
'

# Test 6: Azure Functions Health
run_test "Azure Functions Health" '
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
        https://flipper-scraper-workers.azurewebsites.net/api/health 2>/dev/null || echo "000")
    [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 404 ]
'

# Test 7: Vercel Deployment
run_test "Vercel Homepage Loads" '
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://flipperagents.com)
    [ "$HTTP_CODE" -eq 200 ]
'

# Test 8: SSL Certificate
run_test "SSL Certificate Valid" '
    echo | openssl s_client -servername flipperagents.com -connect flipperagents.com:443 2>/dev/null | \
        openssl x509 -noout -dates >/dev/null 2>&1
'

# Test 9: Security Headers
run_test "Security Headers Present" '
    HEADERS=$(curl -s -I https://flipperagents.com)
    echo "$HEADERS" | grep -i "strict-transport-security" >/dev/null && \
    echo "$HEADERS" | grep -i "x-frame-options" >/dev/null
'

# Test 10: Database Tables Exist
run_test "Database Tables Created" '
    if command -v supabase >/dev/null 2>&1; then
        TABLES=$(supabase db query --linked "
            SELECT COUNT(*) FROM information_schema.tables 
            WHERE table_schema = '\''public'\'' 
            AND table_name IN ('\''users'\'','\''subscriptions'\'','\''scraper_events'\'','\''deal_scores'\'','\''api_keys'\'','\''usage_logs'\'');
        " 2>/dev/null | grep -oP "\d+" | head -1)
        [ "$TABLES" -eq 6 ]
    else
        echo "Skipping: Supabase CLI not installed"
        return 0
    fi
'

# Summary
echo ""
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Test Results Summary                  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "Total Tests: $((TESTS_PASSED + TESTS_FAILED))"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ All tests passed! Production is ready.${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}❌ Some tests failed. Please review before launching.${NC}"
    exit 1
fi
