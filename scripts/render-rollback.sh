#!/usr/bin/env bash
set -euo pipefail

echo "⏪ Triggering rollback…"

curl -sS -X POST \
  "https://api.render.com/v1/services/$RENDER_SERVICE_ID_API/deploys/$RENDER_LAST_GOOD_DEPLOY_ID/rollback" \
  -H "Authorization: Bearer $RENDER_API_KEY"

