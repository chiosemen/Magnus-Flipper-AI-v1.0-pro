#!/usr/bin/env bash
set -euo pipefail

# ============================================================================
# Magnus Flipper – Azure Bootstrap (using existing SP)
# ============================================================================
# This script:
#   - Exports your Azure env vars for the current shell
#   - Prints a JSON block you can paste into env.vault.local.json
#   - Verifies that Azure CLI is logged in and using the right subscription
#
# NOTE: These values come from your previous az commands.
#       If you ever rotate the SP password, update CLIENT_SECRET here too.
# ============================================================================

AZURE_SUBSCRIPTION_ID="77e9f8a3-45bb-4d6b-8372-e593edc1848f"
AZURE_TENANT_ID="5ebfcb20-3394-4fe7-97a6-97ef42f2ebe4"
AZURE_CLIENT_ID="f0804159-ea70-4971-ab9c-238c3ceee715"
AZURE_CLIENT_SECRET="HlB8Q~QQqs.jOg5XWIn5qg3_ss4DHi~ZU8Z1Kbq4"

echo "🔐 Exporting Azure environment variables into current shell..."
export AZURE_SUBSCRIPTION_ID
export AZURE_TENANT_ID
export AZURE_CLIENT_ID
export AZURE_CLIENT_SECRET

echo ""
echo "✅ Azure env vars set for this shell:"
echo "  AZURE_SUBSCRIPTION_ID=${AZURE_SUBSCRIPTION_ID}"
echo "  AZURE_TENANT_ID=${AZURE_TENANT_ID}"
echo "  AZURE_CLIENT_ID=${AZURE_CLIENT_ID}"
echo "  AZURE_CLIENT_SECRET=******** (hidden)"
echo ""

echo "🔎 Verifying Azure subscription..."
az account show --query "{subscriptionId:id, tenantId:tenantId}" -o table || {
  echo "❌ Azure CLI not logged in. Run: az login"
  exit 1
}

echo ""
echo "📦 JSON block for env.vault.local.json / production section:"
cat <<EOF

      "AZURE_SUBSCRIPTION_ID": "${AZURE_SUBSCRIPTION_ID}",
      "AZURE_TENANT_ID": "${AZURE_TENANT_ID}",
      "AZURE_CLIENT_ID": "${AZURE_CLIENT_ID}",
      "AZURE_CLIENT_SECRET": "${AZURE_CLIENT_SECRET}"

EOF

echo "📝 Next:"
echo "  1) Open: secrets/env.vault.local.json"
echo "  2) Replace the FILL_ME_IN_FROM_AZURE placeholders in local.env and production.env with the above block."
echo "  3) Re-run: EnvVaultKeeper in Cursor."
echo "  4) Then run: bash ENV_SYNC_COMMANDS.sh to push to GitHub/Vercel/Azure."

