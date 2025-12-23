#!/usr/bin/env bash
set -e

echo "🧹 PURGING ALL LOCAL & BUILD ARTIFACTS"

# Kill build artifacts
rm -rf node_modules
rm -rf .turbo
rm -rf .next
rm -rf packages/**/dist

# Clear pnpm cache
pnpm store prune

# Reinstall clean
pnpm install

echo "✅ Local cache purged and rebuilt"

