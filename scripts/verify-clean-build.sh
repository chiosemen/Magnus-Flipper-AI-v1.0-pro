#!/bin/bash
# verify-clean-build.sh
# Verifies that Next.js build is clean with no execution context violations
#
# Usage:
#   ./scripts/verify-clean-build.sh
#
# Exit codes:
#   0 - Build is clean
#   1 - Build failed or has errors
#   2 - ECONNREFUSED errors detected
#   3 - TypeScript errors detected
#   4 - Error boundary purity violation

set -e

echo "🔍 Verifying clean Next.js build..."
echo "=================================="
echo ""

# PRE-BUILD GUARD: Check error boundary purity
echo "🔒 Step 1/5: Error Boundary Purity Check"
echo "----------------------------------------"
if ! ./scripts/check-error-boundary-purity.sh; then
  echo ""
  echo "❌ Pre-build check FAILED: Error boundaries contain hooks"
  echo "Fix these violations before building."
  exit 4
fi
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Temporary file for build output
BUILD_LOG=$(mktemp)
trap "rm -f $BUILD_LOG" EXIT

echo "📦 Step 2/5: Running pnpm --filter web build..."
if ! pnpm --filter web build > "$BUILD_LOG" 2>&1; then
  echo -e "${RED}❌ Build failed!${NC}"
  echo ""
  echo "Last 20 lines of output:"
  tail -20 "$BUILD_LOG"
  exit 1
fi

echo -e "${GREEN}✅ Build completed${NC}"
echo ""

# Check for ECONNREFUSED errors
echo "🔍 Step 3/5: Checking for ECONNREFUSED errors..."
ECONNREFUSED_COUNT=$(grep -c "ECONNREFUSED" "$BUILD_LOG" || true)

if [ "$ECONNREFUSED_COUNT" -gt 0 ]; then
  echo -e "${RED}❌ Found $ECONNREFUSED_COUNT ECONNREFUSED errors!${NC}"
  echo ""
  echo "This indicates module-scope network connections during build."
  echo "See: EXECUTION_CONTEXT_GUARDS.md for how to fix."
  echo ""
  grep -A 2 "ECONNREFUSED" "$BUILD_LOG" | head -20
  exit 2
fi

echo -e "${GREEN}✅ No ECONNREFUSED errors${NC}"
echo ""

# Check for TypeScript errors
echo "🔍 Step 4/5: Checking for TypeScript errors..."
if grep -q "error TS" "$BUILD_LOG"; then
  echo -e "${RED}❌ TypeScript errors detected!${NC}"
  echo ""
  grep "error TS" "$BUILD_LOG" | head -10
  exit 3
fi

echo -e "${GREEN}✅ No TypeScript errors${NC}"
echo ""

# Check for compilation success
echo "🔍 Step 5/5: Verifying successful compilation..."
if ! grep -q "Compiled successfully" "$BUILD_LOG"; then
  echo -e "${YELLOW}⚠️  Warning: Could not find 'Compiled successfully' message${NC}"
  echo "Build may have issues. Review full output:"
  echo ""
  tail -30 "$BUILD_LOG"
  exit 1
fi

echo -e "${GREEN}✅ Compilation successful${NC}"
echo ""

# Check for static pages generation
echo "🔍 Checking static pages generation..."
if ! grep -q "Generating static pages" "$BUILD_LOG"; then
  echo -e "${YELLOW}⚠️  Warning: Could not find static pages generation${NC}"
else
  PAGES_LINE=$(grep "Generating static pages" "$BUILD_LOG" | tail -1)
  echo -e "${GREEN}✅ $PAGES_LINE${NC}"
fi
echo ""

# Summary
echo "=================================="
echo -e "${GREEN}🎉 Build verification PASSED!${NC}"
echo ""
echo "Summary:"
echo "  ✅ Error boundaries are SSR-pure (no hooks)"
echo "  ✅ Build completed successfully"
echo "  ✅ Zero ECONNREFUSED errors"
echo "  ✅ No TypeScript errors"
echo "  ✅ Clean compilation"
echo ""
echo "Build is production-ready! 🚀"
exit 0

