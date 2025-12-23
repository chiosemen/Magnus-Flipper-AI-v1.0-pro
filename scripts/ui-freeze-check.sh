#!/usr/bin/env bash
set -e

echo "🔒 UI FREEZE CHECK — Never-Disappear Contract (FINAL)"
echo "----------------------------------------------------"

# Explicit UI-only scope
SCAN_PATHS=(
  "apps/web/components"
  "apps/web/app"
)

EXCLUDES=(
  "!apps/web/app/api/**"
  "!apps/web/app/**/route.ts"
  "!apps/web/app/components/**"
  "!apps/web/components/**/LOW_LEVEL"
)

echo "🔍 Checking for forbidden: return null in UI components…"

if rg "return null" "${SCAN_PATHS[@]}" \
  --glob '!**/*.md' \
  --glob '!**/__tests__/**' \
  --glob '!**/node_modules/**' \
  --glob '!**/dist/**' \
  $(printf -- "--glob %s " "${EXCLUDES[@]}"); then
  echo "❌ Forbidden return null found in UI components"
  exit 1
fi

echo "✅ No forbidden return null in UI components"

echo
echo "🔍 Checking for forbidden: next/image direct imports…"

if rg 'import Image from "next/image"' "${SCAN_PATHS[@]}" \
  --glob '!**/*.md' \
  --glob '!**/SafeImage.tsx' \
  --glob '!**/node_modules/**' \
  --glob '!**/dist/**' \
  $(printf -- "--glob %s " "${EXCLUDES[@]}"); then
  echo "❌ Forbidden next/image imports found"
  exit 1
fi

echo "✅ No forbidden next/image imports"

echo
echo "🟢 UI FREEZE PASSED — Contract intact (FINAL)"
