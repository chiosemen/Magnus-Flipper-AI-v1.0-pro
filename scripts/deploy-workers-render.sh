#!/usr/bin/env bash
set -euo pipefail

ROOT="/Users/chinyeosemene/Developer/Magnus-Flipper-AI-v1.0-pro"
cd "$ROOT"

: "${RENDER_API_KEY:?Set RENDER_API_KEY}"
: "${WORKER_SERVICE_IDS:=<space-separated-render-service-ids>}"

if [ "$WORKER_SERVICE_IDS" = "<space-separated-render-service-ids>" ]; then
  echo "⚠️  Set WORKER_SERVICE_IDS=\"id1 id2 id3\" before running."
fi

for svc in $WORKER_SERVICE_IDS; do
  echo "🚀 Triggering deploy for worker service: $svc"
  response=$(curl -s -X POST "https://api.render.com/v1/services/$svc/deploys" \
    -H "Authorization: Bearer $RENDER_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{"clearCache":true}')
  echo "$response"
done

echo "✅ Deploy requests sent. Track progress in Render dashboard."
