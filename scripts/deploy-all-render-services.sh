#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# Render Full-Stack Deployment Script
# Deploys all 7 services defined in render.yaml
# =============================================================================

echo "🚀 Magnus Flipper AI - Full Stack Deployment"
echo "=============================================="
echo ""

# Check for API key
if [ -z "${RENDER_API_KEY:-}" ]; then
  echo "❌ ERROR: RENDER_API_KEY environment variable is not set"
  echo ""
  echo "To get your API key:"
  echo "1. Go to https://dashboard.render.com/account/settings"
  echo "2. Scroll to 'API Keys'"
  echo "3. Click 'Create API Key'"
  echo "4. Copy the key and export it:"
  echo ""
  echo "   export RENDER_API_KEY='rnd_your_key_here'"
  echo ""
  exit 1
fi

echo "✅ API key found"
echo ""

# Service names from render.yaml
SERVICES=(
  "magnus-flipper-api"
  "magnus-scheduler"
  "magnus-worker-crawler"
  "magnus-worker-analyzer"
  "magnus-worker-alerts"
  "magnus-telegram-bot"
  "magnus-flipper-redis"
)

# Function to get all services
get_services() {
  curl -s "https://api.render.com/v1/services" \
    -H "Authorization: Bearer $RENDER_API_KEY"
}

# Function to trigger deploy for a service
deploy_service() {
  local service_id="$1"
  local service_name="$2"

  echo "🚀 Deploying $service_name ($service_id)..."

  response=$(curl -s -X POST \
    "https://api.render.com/v1/services/$service_id/deploys" \
    -H "Authorization: Bearer $RENDER_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{"clearCache": true}')

  deploy_id=$(echo "$response" | jq -r '.id' 2>/dev/null || echo "")

  if [ -n "$deploy_id" ] && [ "$deploy_id" != "null" ]; then
    echo "   ✅ Deploy started: $deploy_id"
    echo "   📊 Track at: https://dashboard.render.com/deploys/$deploy_id"
    return 0
  else
    echo "   ⚠️  Deploy may have failed. Response:"
    echo "$response" | jq '.' 2>/dev/null || echo "$response"
    return 1
  fi
}

# Get all services
echo "📋 Fetching current services..."
services_json=$(get_services)

if ! echo "$services_json" | jq empty 2>/dev/null; then
  echo "❌ ERROR: Failed to fetch services. Response:"
  echo "$services_json"
  echo ""
  echo "Please check:"
  echo "1. Your RENDER_API_KEY is valid"
  echo "2. You have services deployed in Render"
  echo "3. The API key has sufficient permissions"
  exit 1
fi

# Extract service count
service_count=$(echo "$services_json" | jq 'length' 2>/dev/null || echo "0")
echo "✅ Found $service_count services in your Render account"
echo ""

if [ "$service_count" -eq "0" ]; then
  echo "⚠️  No services found!"
  echo ""
  echo "You need to sync the Render blueprint first:"
  echo "1. Go to https://dashboard.render.com"
  echo "2. Click 'Blueprints' → 'New Blueprint'"
  echo "3. Connect repository: chiosemen/Magnus-Flipper-AI-v1.0-pro"
  echo "4. Branch: main"
  echo "5. Click 'Apply'"
  echo ""
  echo "Or install Render CLI and run:"
  echo "  render blueprint sync --file render.yaml --yes"
  exit 1
fi

# Display services
echo "📊 Current services:"
echo "$services_json" | jq -r '.[] | "  - \(.name) (\(.id)) - \(.type)"' 2>/dev/null || echo "  (Unable to parse service list)"
echo ""

# Trigger deployments
echo "🚀 Triggering deployments..."
echo ""

deployed=0
failed=0

while IFS= read -r line; do
  service_id=$(echo "$line" | awk '{print $1}')
  service_name=$(echo "$line" | awk '{print $2}')

  if deploy_service "$service_id" "$service_name"; then
    ((deployed++)) || true
  else
    ((failed++)) || true
  fi

  echo ""
  sleep 2  # Rate limiting
done < <(echo "$services_json" | jq -r '.[] | "\(.id) \(.name)"' 2>/dev/null || echo "")

# Summary
echo "=============================================="
echo "📊 Deployment Summary"
echo "=============================================="
echo "✅ Deployed: $deployed services"
if [ "$failed" -gt 0 ]; then
  echo "❌ Failed: $failed services"
fi
echo ""

if [ "$deployed" -gt 0 ]; then
  echo "🎯 Next Steps:"
  echo "1. Monitor deployments at: https://dashboard.render.com"
  echo "2. Check service logs for any errors"
  echo "3. Verify all services show 🟢 Live status"
  echo "4. Test API endpoint:"
  echo "   curl https://magnus-flipper-api.onrender.com/health"
  echo "5. Update Vercel frontend with API URL"
  echo ""
fi

if [ "$service_count" -lt 7 ]; then
  echo "⚠️  WARNING: Expected 7 services, but only found $service_count"
  echo ""
  echo "You may need to sync the Render blueprint to create all services:"
  echo "  render blueprint sync --file render.yaml --yes"
  echo ""
  echo "Or use the Render Dashboard (see DEPLOY_NOW.md for instructions)"
  echo ""
fi

echo "✅ Deployment script complete!"
