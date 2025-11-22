#!/usr/bin/env bash
set -euo pipefail

echo "🔍 Checking Render Services Status"
echo "===================================="
echo ""

# Get API key from environment
if [ -z "${RENDER_API_KEY:-}" ]; then
  echo "⚠️  No RENDER_API_KEY set, trying to get services via CLI..."
  echo ""

  # Try using render CLI
  if command -v render &> /dev/null; then
    echo "📋 Your Render Services:"
    echo ""
    render services
    echo ""
    echo "✅ To deploy a specific service:"
    echo "   render deploy create <service-id>"
    echo ""
    echo "📊 To view logs:"
    echo "   render logs <service-name> --tail 100"
  else
    echo "❌ Render CLI not found"
    echo ""
    echo "Please either:"
    echo "1. Set RENDER_API_KEY environment variable"
    echo "2. Check services at: https://dashboard.render.com"
  fi
else
  # Use API
  echo "✅ Using Render API..."
  echo ""

  services=$(curl -s "https://api.render.com/v1/services" \
    -H "Authorization: Bearer $RENDER_API_KEY")

  if echo "$services" | jq empty 2>/dev/null; then
    service_count=$(echo "$services" | jq 'length')
    echo "📊 Found $service_count services:"
    echo ""
    echo "$services" | jq -r '.[] | "  ✓ \(.name) (\(.type)) - \(.id)"'
    echo ""

    if [ "$service_count" -lt 7 ]; then
      echo "⚠️  Expected 7 services, but found $service_count"
      echo ""
      echo "Missing services need to be created via Blueprint:"
      echo "1. Go to: https://dashboard.render.com/blueprints"
      echo "2. Create New Blueprint"
      echo "3. Select your repo and main branch"
      echo ""
    else
      echo "✅ All 7 services found!"
      echo ""
      echo "🚀 Deploy all services:"
      echo "$services" | jq -r '.[] | .id' | while read -r id; do
        echo "   Deploying $id..."
        curl -s -X POST "https://api.render.com/v1/services/$id/deploys" \
          -H "Authorization: Bearer $RENDER_API_KEY" \
          -H "Content-Type: application/json" \
          -d '{"clearCache": true}' | jq -r '.id' | xargs -I {} echo "     Deploy: {}"
      done
    fi
  else
    echo "❌ Failed to fetch services"
    echo "$services"
  fi
fi

echo ""
echo "📊 Check status at: https://dashboard.render.com"
