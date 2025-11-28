#!/usr/bin/env bash
set -euo pipefail

# ===============================================================
# 🔥 MAGNUS FULL DRESS REHEARSAL
# ---------------------------------------------------------------
# Runs the 3-step pre-launch validation sequence:
#   1) Terraform consistency check
#   2) Terraform dry-run (NO apply)
#   3) Release guardrail pipeline (lint + test + build + env verify)
#
# If this script passes, you are READY for production deployment.
# ===============================================================

REPO="${1:-}"

if [[ -z "$REPO" ]]; then
  echo "Usage: $0 <github-owner/repo>"
  echo "Example:"
  echo "  ./scripts/deploy/full-dress-rehearsal.sh chiosemen/Magnus-Flipper-AI-v1.0-pro"
  exit 1
fi

echo
echo "==============================================================="
echo "🎭  MAGNUS FULL DRESS REHEARSAL INITIATED"
echo "==============================================================="
sleep 1

# ---------------------------------------------------------------
# 1️⃣ Step 1: Terraform + GitHub Secrets Consistency Check
# ---------------------------------------------------------------
echo
echo "🩺 STEP 1 — Checking Terraform & GitHub Secrets Consistency..."
echo "---------------------------------------------------------------"

node scripts/deploy/check-terraform-consistency.mjs "$REPO"

echo "✅ STEP 1 PASSED — Terraform & GitHub secrets are consistent."
sleep 1

# ---------------------------------------------------------------
# 2️⃣ Step 2: Terraform Dry Run (Safe rehearsal, NO deploy)
# ---------------------------------------------------------------
echo
echo "🛠  STEP 2 — Terraform Dry Run (Safe Validation)"
echo "---------------------------------------------------------------"

./scripts/deploy/dry-run.sh

echo "✅ STEP 2 PASSED — Terraform dry run succeeded."
sleep 1

# ---------------------------------------------------------------
# 3️⃣ Step 3: Release Guardrails (lint, test, build, env-verify)
# ---------------------------------------------------------------
echo
echo "🚦 STEP 3 — Running Release Guardrails (pnpm release:full)"
echo "---------------------------------------------------------------"

pnpm release:full

echo "✅ STEP 3 PASSED — Build, tests & environment verification clean."
sleep 1

# ---------------------------------------------------------------
# FINAL RESULT
# ---------------------------------------------------------------
echo
echo "==============================================================="
echo "💚  FULL DRESS REHEARSAL COMPLETE — YOU ARE DEPLOYMENT READY"
echo "==============================================================="
echo
echo "Next steps:"
echo "  🚀 1) Run Build & Publish → GitHub Actions"
echo "  🔄 2) Promote image into production via azure-promote.yml"
echo "==============================================================="

