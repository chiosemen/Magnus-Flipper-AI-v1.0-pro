#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$ROOT_DIR"

echo "🔍 [SDK-BUILDER] Root: $ROOT_DIR"

pnpm install --frozen-lockfile

echo "🛠 Building SDK…"
pnpm --filter @magnus-flipper-ai/sdk run build

node - <<'EOF'
const path = require("path");
const sdk = require(path.join(__dirname, "packages/sdk/dist/index.js"));
console.log("SDK exports:", Object.keys(sdk));
console.log("ping():", sdk.ping());
EOF

echo "🎉 SDK rebuilt and verified"
