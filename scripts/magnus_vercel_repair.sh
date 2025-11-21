#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "🔧 Magnus Vercel Repair"

pnpm install --frozen-lockfile

echo "🛠 Building SDK"
pnpm --filter @magnus-flipper-ai/sdk run build

echo "🏗 Building Web"
pnpm --filter web build

echo "✅ Repair complete"
