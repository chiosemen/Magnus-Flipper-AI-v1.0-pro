#!/bin/bash

echo "🔥 SGM CHI M5 — Running Lockfile Resurrection..."

# Navigate to repo root
cd ~/Developer/Magnus-Flipper-AI-v1.0-pro-reset

echo "🧹 Cleaning node_modules..."
rm -rf node_modules
rm -rf apps/web/node_modules
rm -rf apps/api-serverless/node_modules
rm -rf packages/*/node_modules

echo "🔄 Removing old lockfile..."
rm -f pnpm-lock.yaml

echo "📦 Re-installing workspace dependencies..."
pnpm install

echo "👌 New lockfile created successfully."

echo "📝 Adding all changes to git..."
git add pnpm-lock.yaml
git add .

echo "💬 Commit message:"
git commit -m "fix: regenerate pnpm lockfile for Vercel monorepo deploy"

echo "⬆️ Pushing to main..."
git push origin main

echo "🚀 Now deploy again:"
echo "Run: vercel --prod"

