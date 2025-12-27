#!/usr/bin/env bash
set -euo pipefail

# Sync required env vars to Vercel across all environments.
# Assumes `vercel link` has already been run for this repo.

if ! command -v vercel >/dev/null 2>&1; then
  echo "[vercel-env-sync] Vercel CLI not found. Install with: npm i -g vercel"
  exit 1
fi

if [ ! -d ".vercel" ]; then
  echo "[vercel-env-sync] Repo is not linked. Run: vercel link"
  exit 1
fi

REQUIRED_KEYS=(
  "NEXT_PUBLIC_SUPABASE_URL"
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  "SUPABASE_SERVICE_ROLE_KEY"
  "EDGE_CONFIG"
  "EXECUTION_MODE"
  "ADMIN_EMAIL_ALLOWLIST"
  "TRIAL_DURATION_DAYS"
)

ENVIRONMENTS=("production" "preview" "development")

ENV_LINES=$(node <<'NODE'
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "EDGE_CONFIG",
  "EXECUTION_MODE",
  "ADMIN_EMAIL_ALLOWLIST",
  "TRIAL_DURATION_DAYS",
];

[".env.local", ".env"].forEach((file) => {
  const fullPath = path.join(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    dotenv.config({ path: fullPath });
  }
});

const missing = required.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(
    `[vercel-env-sync] Missing required envs: ${missing.join(", ")}`
  );
  process.exit(2);
}

for (const key of required) {
  console.log(`${key}=${process.env[key]}`);
}
NODE
)

while IFS= read -r line; do
  key="${line%%=*}"
  value="${line#*=}"

  if [ -z "$key" ] || [ -z "$value" ]; then
    echo "[vercel-env-sync] Skipping invalid line."
    continue
  fi

  for env in "${ENVIRONMENTS[@]}"; do
    echo "[vercel-env-sync] Syncing ${key} -> ${env}"
    printf '%s' "$value" | vercel env add "$key" "$env" --force >/dev/null
  done
done <<< "$ENV_LINES"

echo "[vercel-env-sync] Sync complete."
