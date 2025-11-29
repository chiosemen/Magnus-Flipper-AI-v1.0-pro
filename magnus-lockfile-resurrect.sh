#!/bin/bash

echo "🔥 SGM CHI M5 — Magnus Lockfile Resurrection Protocol Activated..."
cd ~/Developer/Magnus-Flipper-AI-v1.0-pro-reset

echo "📥 Step 1 — Pull latest remote main (fast-forward only)..."
git pull origin main --rebase

echo "🧹 Step 2 — Remove old lockfile..."
rm -f pnpm-lock.yaml

echo "📦 Step 3 — Clean node_modules (full reset)..."
rm -rf node_modules
rm -rf apps/web/node_modules
rm -rf apps/api-serverless/node_modules
rm -rf packages/*/node_modules

echo "🔄 Step 4 — Reinstall dependencies and regenerate lockfile..."
pnpm install

echo "📝 Step 5 — Stage new lockfile..."
git add pnpm-lock.yaml

echo "💬 Step 6 — Commit..."
git commit -m 'fix: regenerate root pnpm-lock.yaml for Vercel deployment'

echo "⬆️ Step 7 — Push to GitHub..."
git push origin main

echo "🚀 Step 8 — Ready to deploy!"
echo "Run: vercel --cwd apps/web --prod"

