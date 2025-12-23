#!/usr/bin/env bash
set -e

echo "🔒 UI FREEZE CHECK — Deterministic Contract"

SCAN_PATHS=(
  "apps/web/components"
  "apps/web/app/components"
)

echo "🔍 Checking for forbidden return null (unless explicitly LOW_LEVEL)..."

if rg "return null" "${SCAN_PATHS[@]}" \
  --glob '!**/*.md' \
  --glob '!**/__tests__/**' \
  --glob '!**/node_modules/**' \
  --glob '!**/dist/**' \
  --glob '!**/api/**' \
  --glob '!**/route.ts' \
  --glob '!**/route.js' \
  | rg -v "LOW_LEVEL"; then
  echo "❌ Forbidden return null found"
  exit 1
fi

echo "✅ UI freeze passed"
