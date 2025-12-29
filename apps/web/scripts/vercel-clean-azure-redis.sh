#!/usr/bin/env bash
set -euo pipefail

echo "== Vercel Azure / Redis / Playwright / BullMQ purge =="
echo "Project: $(vercel project ls | head -n 1 || echo linked)"

# Ensure project is linked
if ! vercel env ls >/dev/null 2>&1; then
  echo "❌ Not linked to a Vercel project."
  echo "Run: vercel link"
  exit 1
fi

echo ""
echo "== Scanning environment variables =="

PATTERN='^(AZURE_.*|REDIS_.*|PLAYWRIGHT_.*|BULLMQ_.*|SERVICEBUS_.*)$'

MATCHES="$(vercel env ls | awk 'NR>2 {print $1}' | grep -E "$PATTERN" || true)"

if [ -z "$MATCHES" ]; then
  echo "✅ No Azure / Redis / Playwright / BullMQ env vars found."
  exit 0
fi

echo ""
echo "⚠️  The following env vars WILL BE DELETED:"
echo "$MATCHES" | sed 's/^/  - /'

echo ""
read -r -p "Type DELETE to confirm: " CONFIRM
if [ "$CONFIRM" != "DELETE" ]; then
  echo "Aborted."
  exit 0
fi

echo ""
echo "== Deleting variables =="

while IFS= read -r VAR; do
  [ -z "$VAR" ] && continue
  echo "Removing $VAR"
  vercel env rm "$VAR"
done <<< "$MATCHES"

echo ""
echo "== Remaining environment variables =="
vercel env ls

