#!/bin/bash
#
# Production Test Runner Script
# Runs all production readiness tests
#
# Usage:
#   ./run-tests.sh [--smoke] [--contracts] [--workers] [--feed] [--chaos] [--all]
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test configuration
API_URL="${API_URL:-http://localhost:4000}"
WEB_URL="${WEB_URL:-http://localhost:3000}"
WORKER_HEALTH_URL="${WORKER_HEALTH_URL:-http://localhost:4001}"
CHAOS_MODE="${CHAOS_MODE:-false}"

export API_URL WEB_URL WORKER_HEALTH_URL CHAOS_MODE

echo "🚀 Production Readiness Test Suite"
echo "====================================="
echo ""
echo "Configuration:"
echo "  API URL: $API_URL"
echo "  Web URL: $WEB_URL"
echo "  Worker Health URL: $WORKER_HEALTH_URL"
echo "  Chaos Mode: $CHAOS_MODE"
echo ""

# Check if services are available
check_service() {
  local url=$1
  local name=$2
  
  if curl -s -f -o /dev/null "$url/health" 2>/dev/null; then
    echo -e "${GREEN}✅ $name is available${NC}"
    return 0
  else
    echo -e "${YELLOW}⚠️  $name is not available (tests may fail)${NC}"
    return 1
  fi
}

echo "Checking service availability..."
check_service "$API_URL" "API" || true
check_service "$WEB_URL" "Web" || true
check_service "$WORKER_HEALTH_URL" "Worker" || true
echo ""

# Parse arguments
RUN_SMOKE=false
RUN_CONTRACTS=false
RUN_WORKERS=false
RUN_FEED=false
RUN_CHAOS=false
RUN_API_SMOKE=false
RUN_WORKER_INTEGRATION=false
RUN_WEBSOCKET=false
RUN_SSR_ISR=false
RUN_ALL=false

if [ $# -eq 0 ]; then
  RUN_ALL=true
fi

for arg in "$@"; do
  case $arg in
    --smoke)
      RUN_SMOKE=true
      ;;
    --contracts)
      RUN_CONTRACTS=true
      ;;
    --workers)
      RUN_WORKERS=true
      ;;
    --feed)
      RUN_FEED=true
      ;;
    --chaos)
      RUN_CHAOS=true
      ;;
    --api-smoke)
      RUN_API_SMOKE=true
      ;;
    --worker-integration)
      RUN_WORKER_INTEGRATION=true
      ;;
    --websocket)
      RUN_WEBSOCKET=true
      ;;
    --ssr-isr)
      RUN_SSR_ISR=true
      ;;
    --all)
      RUN_ALL=true
      ;;
    *)
      echo "Unknown argument: $arg"
      echo "Usage: $0 [--smoke] [--contracts] [--workers] [--feed] [--chaos] [--api-smoke] [--worker-integration] [--websocket] [--ssr-isr] [--all]"
      exit 1
      ;;
  esac
done

if [ "$RUN_ALL" = true ]; then
  RUN_SMOKE=true
  RUN_CONTRACTS=true
  RUN_WORKERS=true
  RUN_FEED=true
  RUN_CHAOS=true
  RUN_API_SMOKE=true
  RUN_WORKER_INTEGRATION=true
  RUN_WEBSOCKET=true
  RUN_SSR_ISR=true
fi

# Check if Jest is available
if ! command -v npx &> /dev/null; then
  echo -e "${RED}❌ npx not found. Please install Node.js and npm/pnpm.${NC}"
  exit 1
fi

# Run tests
FAILED=0
PASSED=0

run_test_suite() {
  local suite=$1
  local file=$2
  local description=$3
  
  echo ""
  echo "🧪 Running $suite tests..."
  echo "   $description"
  echo "----------------------------------------"
  
  if npx jest "$SCRIPT_DIR/$file" --config "$SCRIPT_DIR/jest.config.js" --verbose; then
    echo -e "${GREEN}✅ $suite tests passed${NC}"
    ((PASSED++))
    return 0
  else
    echo -e "${RED}❌ $suite tests failed${NC}"
    ((FAILED++))
    return 1
  fi
}

if [ "$RUN_SMOKE" = true ]; then
  run_test_suite "smoke" "smoke.test.ts" "Comprehensive smoke tests for all system components"
fi

if [ "$RUN_CONTRACTS" = true ]; then
  run_test_suite "contracts" "api-contracts.test.ts" "API contract validation tests"
fi

if [ "$RUN_WORKERS" = true ]; then
  run_test_suite "workers" "worker-simulation.test.ts" "Worker behavior simulation tests"
fi

if [ "$RUN_FEED" = true ]; then
  run_test_suite "feed" "feed-correctness.test.ts" "Feed engine correctness tests"
fi

if [ "$RUN_CHAOS" = true ]; then
  if [ "$CHAOS_MODE" != "true" ]; then
    echo -e "${YELLOW}⚠️  Chaos tests skipped (CHAOS_MODE=false)${NC}"
    echo "   Set CHAOS_MODE=true to enable chaos engineering tests"
  else
    run_test_suite "chaos" "chaos.test.ts" "Chaos engineering resilience tests"
  fi
fi

if [ "$RUN_API_SMOKE" = true ]; then
  run_test_suite "api-smoke" "api-smoke.test.ts" "API smoke tests"
fi

if [ "$RUN_WORKER_INTEGRATION" = true ]; then
  run_test_suite "worker-integration" "worker-integration.test.ts" "Worker → Supabase → API integration tests"
fi

if [ "$RUN_WEBSOCKET" = true ]; then
  run_test_suite "websocket" "websocket-realtime.test.ts" "Real-time WebSocket tests"
fi

if [ "$RUN_SSR_ISR" = true ]; then
  run_test_suite "ssr-isr" "ssr-isr.test.ts" "SSR/ISR tests"
fi

# Summary
echo ""
echo "📊 Test Summary"
echo "====================================="
echo -e "${GREEN}✅ Passed: $PASSED${NC}"
echo -e "${RED}❌ Failed: $FAILED${NC}"

if [ $FAILED -gt 0 ]; then
  echo ""
  echo -e "${RED}⚠️  Some tests failed. Review output above.${NC}"
  exit 1
else
  echo ""
  echo -e "${GREEN}🎉 All tests passed!${NC}"
  exit 0
fi
