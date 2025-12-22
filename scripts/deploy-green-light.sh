#!/usr/bin/env bash
set -euo pipefail

echo ""
echo "=============================================="
echo "🚦 DEPLOY-DAY GREEN LIGHT CHECK (v1.0)"
echo "=============================================="
echo ""

RED=0

fail() {
  echo "❌ $1"
  RED=1
}

pass() {
  echo "✅ $1"
}

info() {
  echo "▶ $1"
}

############################################
# 1️⃣ Git sanity
############################################
info "Git state"

if [[ -n "$(git status --porcelain)" ]]; then
  fail "Working tree not clean"
else
  pass "Working tree clean"
fi

BRANCH=$(git branch --show-current)
if [[ "$BRANCH" != "main" ]]; then
  fail "Not on main branch (current: $BRANCH)"
else
  pass "On main branch"
fi

############################################
# 2️⃣ UI Freeze Contract
############################################
info "UI Freeze Contract"

if [[ ! -f scripts/ui-freeze-check.sh ]]; then
  fail "ui-freeze-check.sh missing"
else
  if scripts/ui-freeze-check.sh; then
    pass "UI Freeze Contract passed"
  else
    fail "UI Freeze Contract failed"
  fi
fi

############################################
# 3️⃣ Forbidden patterns (SAFE FILTERED)
############################################
info "Forbidden UI patterns"

# Block ONLY section-level return null
BAD_NULLS=$(grep -R "return null;" apps/web \
  | grep -v LOW_LEVEL \
  | grep -v SafeImage \
  | grep -v FeatureGate \
  || true)

if [[ -n "$BAD_NULLS" ]]; then
  echo "$BAD_NULLS"
  fail "Forbidden section-level return null detected"
else
  pass "No forbidden return null patterns"
fi

# Block direct next/image imports (SafeImage allowed)
BAD_IMAGE=$(grep -R "from ['\"]next/image['\"]" apps/web || true)

if [[ -n "$BAD_IMAGE" ]]; then
  echo "$BAD_IMAGE"
  fail "Direct next/image import detected (use SafeImage)"
else
  pass "Image usage compliant"
fi

############################################
# 4️⃣ Builds
############################################
info "Build verification"

if pnpm -r build >/dev/null; then
  pass "pnpm -r build"
else
  fail "Build failed"
fi

############################################
# 5️⃣ Observability endpoint (Phase 0)
############################################
info "Observability endpoint"

if grep -R "app/api/metrics" apps/web >/dev/null 2>&1; then
  pass "Metrics endpoint present"
else
  fail "Metrics endpoint missing"
fi

############################################
# 6️⃣ Feature flags + E2E proof artifacts
############################################
info "Feature flags & E2E proof"

[[ -d apps/web/app/api/flags ]] && pass "Flags API present" || fail "Flags API missing"
[[ -f scripts/flags-smoke-test.ts ]] && pass "Flag smoke test present" || fail "Flag smoke test missing"
[[ -f scripts/prove-e2e.ts ]] && pass "E2E proof script present" || fail "E2E proof script missing"

############################################
# 7️⃣ Final decision
############################################
echo ""
if [[ "$RED" -eq 0 ]]; then
  echo "=============================================="
  echo "🟢 GREEN LIGHT — SAFE TO DEPLOY"
  echo "=============================================="
  exit 0
else
  echo "=============================================="
  echo "🔴 RED LIGHT — DEPLOY BLOCKED"
  echo "Fix issues above before shipping."
  echo "=============================================="
  exit 1
fi

