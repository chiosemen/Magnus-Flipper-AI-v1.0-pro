#!/usr/bin/env bash
set -euo pipefail

ROOT="/Users/chinyeosemene/Developer/Magnus-Flipper-AI-v1.0-pro"
cd "$ROOT"

: "${RENDER_API_KEY:?Set RENDER_API_KEY}"
: "${RENDER_API_SERVICE_ID:=<your-render-api-service-id>}"

echo "🚀 Triggering Render deploy for API (service: $RENDER_API_SERVICE_ID)"

response=$(curl -s -X POST "https://api.render.com/v1/services/$RENDER_API_SERVICE_ID/deploys" \
  -H "Authorization: Bearer $RENDER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"clearCache":true}')

echo "$response"
deployId=$(echo "$response" | jq -r '.id' 2>/dev/null || true)

if [ -n "$deployId" ] && [ "$deployId" != "null" ]; then
  echo "✅ Deploy started. Track at: https://dashboard.render.com/static/deploys/$deployId"
else
  echo "⚠️  Could not parse deploy ID; check output above."
fi
