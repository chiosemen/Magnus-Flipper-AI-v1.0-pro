#!/usr/bin/env bash
set -e

echo "🔍 Running local web build to surface exact error..."
echo "---------------------------------------------------"

pnpm --filter web build || {
  echo ""
  echo "❌ Web build failed."
  echo "👉 Scroll UP — the real error is above."
  exit 1
}

echo ""
echo "✅ Web build passed locally."

