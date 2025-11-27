#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-}"
if [ -z "$BASE_URL" ]; then
  BASE_URL="${SMOKE_BASE_URL:-${APP_URL:-}}"
fi

if [ -z "$BASE_URL" ]; then
  echo "❌ Smoke test requires a base URL. Provide via first argument, SMOKE_BASE_URL, or APP_URL."
  exit 1
fi

echo "🔎 Magnus Deployment Smoke Test"
echo "Base URL: $BASE_URL"

URL="${BASE_URL%/}/health"

if curl --fail --silent --show-error --max-time 10 -o /dev/null "$URL"; then
  echo "✅ Health check succeeded for $URL"
  exit 0
else
  echo "❗ Deployment smoke test failed for $URL"
  exit 1
fi
