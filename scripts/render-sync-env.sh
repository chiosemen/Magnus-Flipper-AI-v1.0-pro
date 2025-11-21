#!/usr/bin/env bash
set -e

ROOT="/Users/chinyeosemene/Developer/Magnus-Flipper-AI-v1.0-pro"
ENV_FILE="$ROOT/.env.production"

if [ ! -f "$ENV_FILE" ]; then
  echo "❌ .env.production not found at $ENV_FILE"
  exit 1
fi

echo "🔄 Syncing .env.production → Render Environment Variables..."
echo ""

# Your Render API key (set manually once before running)
if [ -z "$RENDER_API_KEY" ]; then
  echo "❌ Please export RENDER_API_KEY first:"
  echo "export RENDER_API_KEY=your-key-here"
  exit 1
fi

# ID of the Render web service (API service)
# You will replace this after checking dashboard
SERVICE_ID="<your-render-service-id>"

while IFS='=' read -r key value || [ -n "$key" ]; do
  if [[ "$key" == \#* || -z "$key" ]]; then
    continue
  fi

  echo "➡️  Setting $key..."

  curl -s -X PATCH \
    -H "Authorization: Bearer $RENDER_API_KEY" \
    -H "Content-Type: application/json" \
    "https://api.render.com/v1/services/$SERVICE_ID/env-vars" \
    -d "{\"key\":\"$key\",\"value\":\"$value\"}" > /dev/null

done < "$ENV_FILE"

echo ""
echo "🎉 Render Environment Sync Complete!"
