#!/bin/bash

###############################################################################
# Marketplace Scraper Test Runner
# Runs all scraper tests (Vinted, eBay, Gumtree) sequentially
###############################################################################

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║         MARKETPLACE SCRAPER TEST SUITE                     ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Counter for tracking results
PASSED=0
FAILED=0

# Test Vinted
echo -e "${BLUE}► Running Vinted Scraper Test...${NC}"
echo ""
if tsx test-vinted.ts; then
  PASSED=$((PASSED + 1))
else
  FAILED=$((FAILED + 1))
fi
echo ""

# Test eBay
echo -e "${BLUE}► Running eBay Scraper Test...${NC}"
echo ""
if tsx test-ebay.ts; then
  PASSED=$((PASSED + 1))
else
  FAILED=$((FAILED + 1))
fi
echo ""

# Test Gumtree
echo -e "${BLUE}► Running Gumtree Scraper Test...${NC}"
echo ""
if tsx test-gumtree.ts; then
  PASSED=$((PASSED + 1))
else
  FAILED=$((FAILED + 1))
fi
echo ""

# Summary
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    TEST SUMMARY                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}✓ Passed: $PASSED${NC}"
echo -e "${RED}✗ Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}All tests passed! ✓${NC}"
  exit 0
else
  echo -e "${RED}Some tests failed! ✗${NC}"
  exit 1
fi
