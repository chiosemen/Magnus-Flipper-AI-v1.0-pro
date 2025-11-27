#!/usr/bin/env bash

set -euo pipefail

# Determine repo root
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

echo "🔎 Magnus Dry Run — Monorepo Build + Terraform Plan (NO APPLY)"
echo ""

# ===================================================================
# Step 1: Monorepo Build
# ===================================================================
echo "📦 Step 1: Building monorepo..."
cd "$ROOT_DIR"

pnpm install
pnpm --filter @magnus-flipper-ai/core prisma:generate
pnpm build

echo ""
echo "✅ Monorepo build succeeded"
echo ""

# ===================================================================
# Step 2: Terraform Init + Plan
# ===================================================================
echo "🏗️  Step 2: Terraform validation (init + plan)..."
cd "$ROOT_DIR/infra/azure"

echo "➡️  Running terraform init..."
terraform init

echo ""
echo "➡️  Running terraform plan (image_tag=dry-run-local)..."
terraform plan -var="image_tag=dry-run-local"

echo ""
echo "✅ Dry run complete — build + terraform plan succeeded (no infra changes applied)."
