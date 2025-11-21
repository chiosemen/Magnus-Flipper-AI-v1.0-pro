#!/usr/bin/env bash
set -euo pipefail

SERVICE_ID="${RENDER_SERVICE_ID_API:-}"
API_KEY="${RENDER_API_KEY:-}"

API_BASE="https://api.render.com/v1"

echo "============================================"
echo "🔵🟢 Render Blue/Green Status"
echo "============================================"

INFO=$(curl -sS -H "Authorization: Bearer $API_KEY" \
  "$API_BASE/services/$SERVICE_ID")

echo "$INFO" | jq '.serviceDetails.service | {name,slug,deployId,updatedAt}'
