#!/usr/bin/env bash
set -e

echo "🔒 UI FREEZE CHECK — Never-Disappear Contract"
echo "--------------------------------------------"

# Only scan runtime source files
SCAN_PATHS="apps/web"
INCLUDE_EXTENSIONS="\\.ts$|\\.tsx$"

echo "🔍 Checking for forbidden: return null (section-level)…"
if rg "return null" $SCAN_PATHS \
  --type-add 'ts:*.ts' \
  --type-add 'tsx:*.tsx' \
  -g '!**/*.md' \
  -g '!**/.github/**' \
  -g '!**/node_modules/**' \
  -g '!**/dist/**' \
  | rg -v "LOW_LEVEL"; then
  echo "❌ Forbidden return null found"
  exit 1
fi
echo "✅ No forbidden return null found"

echo
echo "🔍 Checking for forbidden: next/image direct imports…"
if rg 'import Image from "next/image"' $SCAN_PATHS \
  --type-add 'ts:*.ts' \
  --type-add 'tsx:*.tsx' \
  -g '!**/*.md' \
  -g '!**/.github/**' \
  -g '!**/SafeImage.tsx' \
  -g '!**/node_modules/**' \
  -g '!**/dist/**'; then
  echo "❌ Forbidden next/image imports found"
  exit 1
fi
echo "✅ No forbidden next/image imports found"

echo
echo "🟢 UI FREEZE PASSED — Contract intact"
