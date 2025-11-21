#!/usr/bin/env bash
set -euo pipefail

ROOT="/Users/chinyeosemene/Developer/Magnus-Flipper-AI-v1.0-pro"
cd "$ROOT"

SERVICE_ID="${RENDER_SERVICE_ID_API:-}"
API_KEY="${RENDER_API_KEY:-}"

if [ -z "$SERVICE_ID" ] || [ -z "$API_KEY" ]; then
  echo "❌ RENDER_SERVICE_ID_API and/or RENDER_API_KEY not set."
  echo "Set them in your shell or .env before running."
  exit 1
fi

API_BASE="https://api.render.com/v1"

echo "=============================================="
echo "🚀 Render Zero-Downtime Deploy (API service)"
echo "Service: $SERVICE_ID"
echo "=============================================="

echo "📦 Creating deploy..."
DEPLOY_RESPONSE=$(curl -sS -X POST "$API_BASE/services/$SERVICE_ID/deploys" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{}')

DEPLOY_ID=$(echo "$DEPLOY_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('id',''))" || echo "")

if [ -z "$DEPLOY_ID" ]; then
  echo "❌ Could not parse deploy id from response:"
  echo "$DEPLOY_RESPONSE"
  exit 1
fi

echo "✅ Deploy created: $DEPLOY_ID"
echo "⏱ Polling for status..."

while true; do
  STATUS_JSON=$(curl -sS -X GET "$API_BASE/services/$SERVICE_ID/deploys/$DEPLOY_ID" \
    -H "Authorization: Bearer $API_KEY")
  STATUS=$(echo "$STATUS_JSON" | python3 -c "import sys, json; print(json.load(sys.stdin).get('status',''))" || echo "")

  echo "   Current status: $STATUS"
  case "$STATUS" in
    live)
      echo "✅ Deploy is live. Zero-downtime rollout complete."
      break
      ;;
    failed|canceled)
      echo "❌ Deploy failed or canceled."
      echo "$STATUS_JSON"
      exit 1
      ;;
    *)
      sleep 10
      ;;
  esac
done

echo "🎉 Finished zero-downtime deploy for API."

