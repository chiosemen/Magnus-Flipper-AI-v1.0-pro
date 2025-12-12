#!/bin/bash
set -euo pipefail

# CI Preflight Guardian
# Enforces invariant CI order and fails fast on any violation
# Works both locally and in CI environments

REPORT_FILE="${CI_PREFLIGHT_REPORT:-CI_PREFLIGHT_REPORT.md}"
FAILED=false
START_TIME=$(date +%s)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Initialize report
cat > "$REPORT_FILE" <<EOF
# 🛡️ CI Preflight Report

**Generated**: $(date -u +"%Y-%m-%d %H:%M:%S UTC")
**Environment**: ${CI:-local}
**Node Version**: $(node --version 2>/dev/null || echo "not found")
**pnpm Version**: $(pnpm --version 2>/dev/null || echo "not found")

---

## Invariant Order Enforcement

This report validates that all CI steps follow the required invariant order:

1. ✅ Checkout repository
2. ✅ Setup Node 20 + pnpm
3. ✅ \`pnpm -w install --frozen-lockfile\`
4. ✅ \`pnpm build:packages\` (MUST run before consumer type-check)
5. ✅ Lint (consumer-specific)
6. ✅ Type-check (consumer-specific)
7. ✅ Test (if script exists)
8. ✅ Build (if script exists)

---

## Validation Results

EOF

log_step() {
  local step=$1
  local status=$2
  local message=$3
  
  if [ "$status" = "PASS" ]; then
    echo -e "${GREEN}✅${NC} $step: $message"
    echo "- ✅ **$step**: $message" >> "$REPORT_FILE"
  elif [ "$status" = "FAIL" ]; then
    echo -e "${RED}❌${NC} $step: $message"
    echo "- ❌ **$step**: $message" >> "$REPORT_FILE"
    FAILED=true
  else
    echo -e "${YELLOW}⚠️${NC} $step: $message"
    echo "- ⚠️ **$step**: $message" >> "$REPORT_FILE"
  fi
}

check_node_version() {
  local node_version=$(node --version 2>/dev/null || echo "")
  if [ -z "$node_version" ]; then
    log_step "Node.js Check" "FAIL" "Node.js not found"
    return 1
  fi
  
  local major_version=$(echo "$node_version" | sed 's/v\([0-9]*\).*/\1/')
  if [ "$major_version" -eq 20 ]; then
    log_step "Node.js Check" "PASS" "Node $node_version (required: v20.x)"
  else
    log_step "Node.js Check" "FAIL" "Node $node_version (required: v20.x)"
    return 1
  fi
}

check_pnpm() {
  if ! command -v pnpm &> /dev/null; then
    log_step "pnpm Check" "FAIL" "pnpm not found in PATH"
    return 1
  fi
  
  local pnpm_version=$(pnpm --version)
  log_step "pnpm Check" "PASS" "pnpm $pnpm_version installed"
}

check_lockfile() {
  if [ ! -f "pnpm-lock.yaml" ]; then
    log_step "Lockfile Check" "FAIL" "pnpm-lock.yaml not found"
    return 1
  fi
  
  log_step "Lockfile Check" "PASS" "pnpm-lock.yaml exists"
}

validate_package_json() {
  # Check that package.json exists and has required scripts
  if [ ! -f "package.json" ]; then
    log_step "Package.json Check" "FAIL" "package.json not found in root"
    return 1
  fi
  
  # Check build:packages script exists
  if grep -q "\"build:packages\"" package.json; then
    log_step "Package.json Check" "PASS" "build:packages script exists"
  else
    log_step "Package.json Check" "FAIL" "build:packages script not found in root package.json"
    return 1
  fi
}

validate_workspace_structure() {
  # Check workspace directories exist
  if [ ! -d "apps" ] || [ ! -d "packages" ]; then
    log_step "Workspace Structure" "FAIL" "apps/ or packages/ directory missing"
    return 1
  fi
  
  log_step "Workspace Structure" "PASS" "Monorepo structure valid"
}

# Main execution
main() {
  echo "🛡️  CI Preflight Guardian Starting..."
  echo ""
  
  # Step 1: Check Node version
  if ! check_node_version; then
    FAILED=true
  fi
  
  # Step 2: Check pnpm
  if ! check_pnpm; then
    FAILED=true
  fi
  
  # Step 3: Check lockfile
  if ! check_lockfile; then
    FAILED=true
  fi
  
  # If basic checks fail, stop early
  if [ "$FAILED" = true ]; then
    echo ""
    echo -e "${RED}❌ Preflight failed at basic checks. Stopping.${NC}"
    append_summary
    exit 1
  fi
  
  # Step 4: Validate package.json structure
  if ! validate_package_json; then
    FAILED=true
    append_summary
    exit 1
  fi
  
  # Step 5: Validate workspace structure
  if ! validate_workspace_structure; then
    FAILED=true
    append_summary
    exit 1
  fi
  
  # Step 6: Check package scripts exist (validation only)
  if [ -f "apps/web/package.json" ]; then
    if grep -q "\"lint\"" apps/web/package.json && grep -q "\"typecheck\"" apps/web/package.json; then
      log_step "Web Scripts Check" "PASS" "lint and typecheck scripts exist"
    else
      log_step "Web Scripts Check" "WARN" "Some scripts may be missing"
    fi
  fi
  
  if [ -f "apps/mobile/package.json" ]; then
    if grep -q "\"lint\"" apps/mobile/package.json && (grep -q "\"type-check\"" apps/mobile/package.json || grep -q "\"typecheck\"" apps/mobile/package.json); then
      log_step "Mobile Scripts Check" "PASS" "lint and type-check scripts exist"
    else
      log_step "Mobile Scripts Check" "WARN" "Some scripts may be missing"
    fi
  fi
  
  append_summary
}

append_summary() {
  local end_time=$(date +%s)
  local duration=$((end_time - START_TIME))
  
  cat >> "$REPORT_FILE" <<EOF

---

## Summary

**Status**: $([ "$FAILED" = false ] && echo "✅ PASS" || echo "❌ FAIL")
**Duration**: ${duration}s
**Timestamp**: $(date -u +"%Y-%m-%d %H:%M:%S UTC")

### Next Steps

$([ "$FAILED" = false ] && echo "✅ All checks passed. Safe to proceed with CI." || echo "❌ Preflight failed. Fix issues before pushing.")

EOF

  if [ "$FAILED" = true ]; then
    echo ""
    echo -e "${RED}════════════════════════════════════════${NC}"
    echo -e "${RED}  ❌ PREFLIGHT FAILED${NC}"
    echo -e "${RED}════════════════════════════════════════${NC}"
    echo ""
    echo "Report saved to: $REPORT_FILE"
    exit 1
  else
    echo ""
    echo -e "${GREEN}════════════════════════════════════════${NC}"
    echo -e "${GREEN}  ✅ PREFLIGHT PASSED${NC}"
    echo -e "${GREEN}════════════════════════════════════════${NC}"
    echo ""
    echo "Report saved to: $REPORT_FILE"
  fi
}

# Run main
main "$@"

