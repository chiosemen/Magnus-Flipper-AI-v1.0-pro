#!/usr/bin/env bash
set -euo pipefail

pnpm --filter @magnus-flipper-ai/sdk run build

node - <<'EOF'
const path = require("path");
const sdk = require(path.join(__dirname, "packages/sdk/dist/index.js"));
console.log("SDK exports:", Object.keys(sdk));
EOF

echo "SDK OK"
