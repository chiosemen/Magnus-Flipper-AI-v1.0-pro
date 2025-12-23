#!/usr/bin/env bash
set -e

echo "🔒 UI FREEZE CHECK — Never-Disappear Contract"
echo "--------------------------------------------"

# ONLY scan renderable UI
SCAN_PATHS=(
  "apps/web/app"
  "apps/web/components"
)

echo "🔍 Checking for forbidden: return null in UI components…"

if rg "return null" "${SCAN_PATHS[@]}" \
  --type-add 'ts:*.ts' \
  --type-add 'tsx:*.tsx' \
  -g '!**/*.md' \
  -g '!**/__tests__/**' \
  -g '!**/node_modules/**' \
  -g '!**/dist/**' \
  | rg -v "LOW_LEVEL"; then
  echo "❌ Forbidden return null found in UI components"
  exit 1
fi

echo "✅ No forbidden return null in UI components"

echo
echo "🔍 Checking for forbidden: next/image direct imports…"

if rg 'import Image from "next/image"' "${SCAN_PATHS[@]}" \
  --type-add 'ts:*.ts' \
  --type-add 'tsx:*.tsx' \
  -g '!**/*.md' \
  -g '!**/SafeImage.tsx' \
  -g '!**/node_modules/**' \
  -g '!**/dist/**'; then
  echo "❌ Forbidden next/image imports found"
  exit 1
fi

echo "✅ No forbidden next/image imports"

echo
echo "🟢 UI FREEZE PASSED — Contract intact"
