
#!/usr/bin/env bash
set -euo pipefail

# ==========================================================
# DEPLOY GREEN-LIGHT GATE — v1.0-final
#
# STATUS: FROZEN
# PURPOSE: Final deploy-day safety gate
#
# DO NOT MODIFY without:
#  - UI Freeze Contract update
#  - Observability Phase change
#  - Deployment Playbook update
#
# This gate intentionally:
#  - Allows LOW_LEVEL return null
#  - Allows SafeImage to import next/image
#  - Treats metrics endpoint as NON-BLOCKING
#
# Owner: Platform / Release Engineering
# ==========================================================

#!/usr/bin/env bash
set -euo pipefail

echo ""
echo "=============================================="
echo "🚦 DEPLOY GREEN-LIGHT CHECK (v1.0)"
echo "=============================================="
echo ""

FAILED=0

fail() {
  echo "❌ $1"
  FAILED=1
}

pass() {
  echo "✅ $1"
}

############################################
# 1️⃣ Git Working Tree
############################################
echo "🔍 Checking git working tree..."
if [[ -n "$(git status --porcelain)" ]]; then
  fail "Git working tree is dirty (uncommitted changes)"
else
  pass "Git working tree is clean"
fi

############################################
# 2️⃣ UI Freeze Gate
############################################
echo ""
echo "🔍 Running UI freeze check..."
if [[ ! -f scripts/ui-freeze-check.sh ]]; then
  fail "ui-freeze-check.sh not found"
else
  if bash scripts/ui-freeze-check.sh >/dev/null 2>&1; then
    pass "UI freeze gate passed"
  else
    fail "UI freeze gate failed (run scripts/ui-freeze-check.sh for details)"
  fi
fi

############################################
# 3️⃣ Metrics Endpoint (File Existence)
############################################
echo ""
echo "🔍 Checking metrics endpoint file..."
if [[ -f apps/web/app/api/metrics/route.ts ]]; then
  pass "Metrics endpoint file exists"
else
  echo "⚠️  Metrics endpoint file not found: apps/web/app/api/metrics/route.ts (non-blocking)"
  # Note: Metrics may be implemented in packages/api or other locations
fi

############################################
# 4️⃣ Feature Flags Migration
############################################
echo ""
echo "🔍 Checking feature flags migration..."
if [[ -f supabase/migrations/20241222_01_feature_flags.sql ]]; then
  pass "Feature flags migration exists"
else
  # Check for any feature_flags migration
  if find supabase/migrations -name "*feature_flags*.sql" -type f | grep -q .; then
    pass "Feature flags migration exists"
  else
    fail "Feature flags migration not found"
  fi
fi

############################################
# 5️⃣ Forbidden Patterns
############################################
echo ""
echo "🔍 Checking for forbidden patterns..."

# Check for section-level return null (excluding LOW_LEVEL markers)
RETURN_NULL_VIOLATIONS=$(grep -Rn "return null" apps/web/components \
  | while IFS=: read file line rest; do
      # Check if previous 2 lines contain LOW_LEVEL
      if sed -n "$((line-2)),${line}p" "$file" 2>/dev/null | grep -q "LOW_LEVEL"; then
        continue
      fi
      echo "$file:$line:$rest"
    done || true)

if [[ -n "$RETURN_NULL_VIOLATIONS" ]]; then
  echo "$RETURN_NULL_VIOLATIONS"
  fail "Forbidden section-level 'return null' detected"
else
  pass "No forbidden 'return null' patterns"
fi

# Check for direct next/image imports (excluding SafeImage.tsx)
IMAGE_VIOLATIONS=$(grep -R "from \"next/image\"" apps/web \
  | grep -v "SafeImage.tsx" \
  || true)

if [[ -n "$IMAGE_VIOLATIONS" ]]; then
  echo "$IMAGE_VIOLATIONS"
  fail "Forbidden direct 'next/image' imports detected (use SafeImage)"
else
  pass "No forbidden 'next/image' imports"
fi

############################################
# Final Decision
############################################
echo ""
echo "=============================================="
if [[ "$FAILED" -eq 0 ]]; then
  echo "🟢 GREEN LIGHT — SAFE TO DEPLOY"
  echo "=============================================="
  exit 0
else
  echo "🔴 RED LIGHT — DEPLOY BLOCKED"
  echo "Fix the issues above before deploying."
  echo "=============================================="
  exit 1
fi
