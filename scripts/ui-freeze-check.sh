#!/usr/bin/env bash
set -euo pipefail

echo "🔒 UI FREEZE CHECK — Never-Disappear Contract"
echo "--------------------------------------------"

FAILED=0

echo "🔍 Checking for forbidden: return null (section-level)…"
# Find all return null, then filter out those with LOW_LEVEL in context (previous 2 lines)
RETURN_NULL_MATCHES=$(grep -Rn "return null" apps/web/components \
  | while IFS=: read file line rest; do
      # Check if previous 2 lines contain LOW_LEVEL
      if sed -n "$((line-2)),${line}p" "$file" 2>/dev/null | grep -q "LOW_LEVEL"; then
        continue
      fi
      echo "$file:$line:$rest"
    done || true)

if [[ -n "$RETURN_NULL_MATCHES" ]]; then
  echo "❌ Found forbidden 'return null':"
  echo "$RETURN_NULL_MATCHES"
  FAILED=1
else
  echo "✅ No forbidden return null found"
fi

echo
echo "🔍 Checking for forbidden: next/image direct imports…"
IMAGE_MATCHES=$(grep -R "from \"next/image\"" apps/web \
  | grep -v "SafeImage.tsx" \
  || true)

if [[ -n "$IMAGE_MATCHES" ]]; then
  echo "❌ Found forbidden next/image imports:"
  echo "$IMAGE_MATCHES"
  FAILED=1
else
  echo "✅ No direct next/image imports found"
fi

echo
if [[ "$FAILED" -eq 1 ]]; then
  echo "🚫 UI FREEZE FAILED — Fix violations before deploy"
  exit 1
else
  echo "🟢 UI FREEZE PASSED — Contract intact"
fi

