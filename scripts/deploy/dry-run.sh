#!/usr/bin/env bash
set -euo pipefail

echo "🔎 Magnus Dry Run — Build + Terraform Plan (NO APPLY)"

echo "📦 Step 1: Installing dependencies..."
pnpm install

echo "🔧 Step 2: Generating Prisma client..."
pnpm --filter @magnus-flipper-ai/core prisma:generate

echo "🏗️ Step 3: Building monorepo..."
pnpm build

echo "🌍 Step 4: Terraform Init..."
cd infra/azure
terraform init

echo "📝 Step 5: Terraform Plan (dry-run)..."
terraform plan -var=\"image_tag=dry-run-local\"

echo "✅ Dry run complete (no infra changes applied)."

