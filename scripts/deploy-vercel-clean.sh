#!/usr/bin/env bash
set -e

echo "🚀 Clean production deploy (force rebuild)"

git checkout main
git pull origin main

export NEXT_DISABLE_TURBOPACK=1

vercel deploy --prod --force

echo "✅ Deploy triggered"

