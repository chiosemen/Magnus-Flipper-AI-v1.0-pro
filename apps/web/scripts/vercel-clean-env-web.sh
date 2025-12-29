#!/usr/bin/env bash
set -euo pipefail

# Run this from repo root.
# It will clean env vars ONLY in apps/web (magnus-flipper-web), and only ones that match legacy patterns.

cd apps/web

echo "== Checking Vercel link =="
if ! vercel env ls >/dev/null 2>&1; then
  echo "Not linked. Run: cd apps/web && vercel link"
  exit 1
fi

echo "== Fetching env var names =="
NAMES="$(vercel env ls | awk 'NR>2 {print $1}' | sed '/^$/d' | sort -u)"

# Patterns to remove (scoped to legacy Guardian/Worker infra + old flags)
# Edit this list if you want to be even more aggressive or more conservative.
PATTERN='^(NEXT_PUBLIC_WORKER_URL|NEXT_PUBLIC_DG_READ_TOKEN|DEPLOY_GUARDIAN_READ_TOKEN|DEPLOY_GUARDIAN_INGEST_TOKEN|DEV_POOL_FORCE|EXECUTION_MODE|INVESTOR_DEMO_MODE|SHOW_EMPTY_MARKETPLACE|DEALER_ENGINE_ENABLED|NEXT_PUBLIC_MM_AGENT_TOKEN)$'

TO_DELETE="$(echo "$NAMES" | grep -E "$PATTERN" || true)"

echo ""
echo "== Candidate env vars to delete from magnus-flipper-web =="
if [ -z "${TO_DELETE}" ]; then
  echo "None matched. Nothing to delete."
  exit 0
fi

echo "$TO_DELETE" | sed 's/^/ - /'

echo ""
read -r -p "Proceed to delete these vars (you will be prompted per env)? [y/N] " CONFIRM
if [[ "${CONFIRM}" != "y" && "${CONFIRM}" != "Y" ]]; then
  echo "Aborted."
  exit 0
fi

echo ""
echo "== Deleting… =="
while IFS= read -r VAR; do
  [ -z "$VAR" ] && continue
  echo ""
  echo "Removing: $VAR"
  vercel env rm "$VAR"
done <<< "$TO_DELETE"

echo ""
echo "== Done. Remaining vars: =="
vercel env ls

