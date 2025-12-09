#!/usr/bin/env bash

set -e

echo "🌍  GLOBAL ENVIRONMENT SYNC ORCHESTRATOR v2"
echo "=========================================="
echo ""

# --- Utilities ---
red() { echo -e "\033[31m$1\033[0m"; }
green() { echo -e "\033[32m$1\033[0m"; }
yellow() { echo -e "\033[33m$1\033[0m"; }

check_cli() {
  if ! command -v "$1" &> /dev/null; then
    red "❌ Missing required CLI: $1"
    exit 1
  fi
}

# --- CLI Checks ---
echo "🔍 Validating required CLIs..."
check_cli gh
check_cli vercel
check_cli az
green "✔ All required CLIs detected"
echo ""

# --- Determine script directory ---
ROOT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"

SYNC_FILE="$ROOT_DIR/ENV_SYNC_COMMANDS.sh"
if [ ! -f "$SYNC_FILE" ]; then
  red "❌ Missing ENV_SYNC_COMMANDS.sh. Run EnvVaultKeeper first."
  exit 1
fi

run_github_sync() {
  echo ""
  echo "🐙 Syncing GitHub Secrets..."
  bash "$SYNC_FILE" --github || red "⚠ GitHub sync warnings"
}

run_vercel_sync() {
  echo ""
  echo "▲ Syncing Vercel Environment Variables..."
  bash "$SYNC_FILE" --vercel || red "⚠ Vercel sync warnings"
}

run_azure_sync() {
  echo ""
  echo "☁️ Syncing Azure Container Apps Secrets..."
  bash "$SYNC_FILE" --azure || red "⚠ Azure sync warnings"
}

case "$1" in
  --github)
    run_github_sync
    ;;

  --vercel)
    run_vercel_sync
    ;;

  --azure)
    run_azure_sync
    ;;

  --all)
    echo "🚦 Running FULL environment sync sequence..."
    run_github_sync
    run_vercel_sync
    run_azure_sync
    green "🎉 FULL SYNC COMPLETE"
    ;;

  *)
    echo "Usage:"
    echo "  env-sync --all       # run GitHub + Vercel + Azure"
    echo "  env-sync --github    # GitHub only"
    echo "  env-sync --vercel    # Vercel only"
    echo "  env-sync --azure     # Azure only"
    exit 0
    ;;

esac
