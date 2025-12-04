#!/bin/bash
# Emergency script to cap all workers at 1 replica
# Use case: Cost control, maintenance, or troubleshooting

set -e

RESOURCE_GROUP="${AZURE_RESOURCE_GROUP:-magnus-rg}"

echo "=== Emergency: Capping All Workers at 1 Replica ==="
echo "Resource Group: $RESOURCE_GROUP"
echo ""

# Check if logged in
if ! az account show &>/dev/null; then
  echo "❌ ERROR: Not logged into Azure. Run 'az login' first."
  exit 1
fi

WORKERS=("worker-scraper" "worker-tracker" "worker-autosell")

for worker in "${WORKERS[@]}"; do
  echo "Capping $worker at 1 replica..."
  
  if ! az containerapp show --name "$worker" --resource-group "$RESOURCE_GROUP" &>/dev/null; then
    echo "  ⚠️  WARNING: Container App '$worker' not found, skipping..."
    continue
  fi
  
  az containerapp update \
    --name "$worker" \
    --resource-group "$RESOURCE_GROUP" \
    --min-replicas 1 \
    --max-replicas 1 \
    --output none
  
  echo "  ✅ $worker capped at 1 replica"
done

echo ""
echo "=== Emergency Cap Complete ==="
echo "All workers are now capped at 1 replica."
echo ""
echo "To restore default scaling, run:"
echo "  ./infra/scale/setup-scale-rules.sh"

