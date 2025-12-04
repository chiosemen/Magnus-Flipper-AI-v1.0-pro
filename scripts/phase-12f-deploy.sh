#!/bin/bash

# === Phase 12F: Auto-Redeploy Workers with v3 Images ===

RESOURCE_GROUP="magnus-rg"
ENV_NAME="magnus-ca-env"
ACR="magnusacr.azurecr.io"

# --- SECRET VALUES ---
SUPABASE_URL="https://hfqhwdbdsvdbrorpnnbf.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhmcWh3ZGJkc3ZkYnJvcnBubmJmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjE5NjQ2OCwiZXhwIjoyMDc3NzcyNDY4fQ.QIPd6EnsQ-DGkzYKFgPl1CcaUkwTEprK7zJa34EZLiU"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhmcWh3ZGJkc3ZkYnJvcnBubmJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxOTY0NjgsImV4cCI6MjA3Nzc3MjQ2OH0.JKFmb7fekwR7EtIGr4DdwLYzBYX9xevfs4wdjoNG1Cw"

echo "=== Setting Secrets for All Workers ==="

for APP in worker-scraper worker-tracker worker-autosell
do
  az containerapp secret set \
    --name $APP \
    --resource-group $RESOURCE_GROUP \
    --secrets \
      supabase-url="$SUPABASE_URL" \
      supabase-service-role-key="$SUPABASE_SERVICE_ROLE_KEY" \
      supabase-anon-key="$SUPABASE_ANON_KEY"

  echo "Secrets updated for $APP"
done

echo "=== Redeploying using v3 images ==="

# --- SCRAPER ---
az containerapp update \
  --name worker-scraper \
  --resource-group $RESOURCE_GROUP \
  --image $ACR/worker-scraper:v3 \
  --set-env-vars \
      SUPABASE_URL=secretref:supabase-url \
      SUPABASE_SERVICE_ROLE_KEY=secretref:supabase-service-role-key \
      SUPABASE_ANON_KEY=secretref:supabase-anon-key \
      NODE_ENV=production \
      LOG_LEVEL=info

# --- TRACKER ---
az containerapp update \
  --name worker-tracker \
  --resource-group $RESOURCE_GROUP \
  --image $ACR/worker-tracker:v3 \
  --set-env-vars \
      SUPABASE_URL=secretref:supabase-url \
      SUPABASE_SERVICE_ROLE_KEY=secretref:supabase-service-role-key \
      SUPABASE_ANON_KEY=secretref:supabase-anon-key \
      NODE_ENV=production \
      LOG_LEVEL=info

# --- AUTOSELL ---
az containerapp update \
  --name worker-autosell \
  --resource-group $RESOURCE_GROUP \
  --image $ACR/worker-autosell:v3 \
  --set-env-vars \
      SUPABASE_URL=secretref:supabase-url \
      SUPABASE_SERVICE_ROLE_KEY=secretref:supabase-service-role-key \
      SUPABASE_ANON_KEY=secretref:supabase-anon-key \
      NODE_ENV=production \
      LOG_LEVEL=info

echo "=== Phase 12F Deployment Complete ==="
echo "Checking worker statuses..."

az containerapp list \
  --resource-group $RESOURCE_GROUP \
  --query "[?contains(name, 'worker')].{Name:name, Status:properties.provisioningState, Running:properties.runningStatus}" \
  --output table

