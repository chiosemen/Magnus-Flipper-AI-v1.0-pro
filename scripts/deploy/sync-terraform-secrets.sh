#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# Magnus Flipper AI — terraform.tfvars → GitHub Secrets Sync
# ------------------------------------------------------------
# Usage:
#   ./scripts/deploy/sync-terraform-secrets.sh owner/repo
#
# Requires:
#   - gh CLI installed and authenticated
#   - infra/azure/terraform.tfvars present
#
# This script DOES NOT push anything automatically.
# It prints the gh secret commands first, then asks for confirmation.
# ============================================================

REPO="${1:-}"
TFVARS_FILE="infra/azure/terraform.tfvars"

if [[ -z "$REPO" ]]; then
  echo "Usage: $0 <github-owner/repo>"
  echo "Example: $0 chiosemen/Magnus-Flipper-AI-v1.0-pro"
  exit 1
fi

if [[ ! -f "$TFVARS_FILE" ]]; then
  echo "ERROR: $TFVARS_FILE not found. Run from repo root."
  exit 1
fi

echo "Reading secrets from: $TFVARS_FILE"
echo

# Helper: get value for a given terraform key: key = "value"
get_tfvar() {
  local key="$1"
  # Match lines like: key = "value"
  local line
  line=$(grep -E "^[[:space:]]*${key}[[:space:]]*=" "$TFVARS_FILE" || true)
  if [[ -z "$line" ]]; then
    echo ""
    return 0
  fi
  # Extract between first pair of quotes
  echo "$line" | sed -E 's/^[^"]*"([^"]*)".*$/\1/'
}

# Mapping: terraform var -> GitHub secret name
declare -A MAP=(
  ["subscription_id"]="AZURE_SUBSCRIPTION_ID"
  ["database_url"]="DATABASE_URL"
  ["supabase_url"]="SUPABASE_URL"
  ["supabase_anon_key"]="SUPABASE_ANON_KEY"
  ["supabase_service_role_key"]="SUPABASE_SERVICE_ROLE_KEY"
  ["jwt_secret"]="JWT_SECRET"
  ["stripe_secret_key"]="STRIPE_SECRET_KEY"
  ["stripe_webhook_secret"]="STRIPE_WEBHOOK_SECRET"
  ["openai_key"]="OPENAI_API_KEY"
  ["app_url"]="APP_URL"
)

echo "Planned GitHub Secrets for repo: $REPO"
echo "--------------------------------------------------"

COMMANDS=()

for tf_key in "${!MAP[@]}"; do
  secret_name="${MAP[$tf_key]}"
  value="$(get_tfvar "$tf_key")"

  if [[ -z "$value" ]]; then
    echo "⚠ Skipping $secret_name (no value for terraform key: $tf_key)"
    continue
  fi

  echo "• $secret_name  ←  $tf_key"
  # We don't echo the value to avoid printing secrets on screen
  COMMANDS+=("printf '%s' '$value' | gh secret set $secret_name --repo '$REPO' --app actions")
done

echo
echo "These commands will be executed to sync secrets:"
echo "--------------------------------------------------"
for cmd in "${COMMANDS[@]}"; do
  echo "$cmd"
done

echo
read -r -p "Proceed to apply these secrets to GitHub? [y/N] " CONFIRM
if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
  echo "Aborting without changing GitHub secrets."
  exit 0
fi

echo
echo "Applying secrets..."
for cmd in "${COMMANDS[@]}"; do
  eval "$cmd"
done

echo "✅ Secrets sync complete."

