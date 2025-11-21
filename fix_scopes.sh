#!/usr/bin/env bash

set -e

ROOT="/Users/chinyeosemene/Developer/Magnus-Flipper-AI-v1.0-pro"

echo "🔧 Converting monorepo to scoped namespace: @magnus-flipper-ai/"
cd "$ROOT"

# 1. Update every package.json name field
find packages apps -name package.json | while read f; do
  echo "Updating $f"
  sed -i '' 's/"name": "@magnus[^"]*\/\(.*\)"/"name": "@magnus-flipper-ai\/\1"/' "$f"
done

# 2. Update all import references in TS/JS files
grep -Rl "@magnus" packages apps web mobile | while read f; do
  sed -i '' 's/@magnus[^/]*\//@magnus-flipper-ai\//g' "$f"
done

# 3. Update pnpm-workspace.yaml
sed -i '' 's/@magnus[^"]*/*/g' pnpm-workspace.yaml

echo "✨ Finished scope migration → @magnus-flipper-ai/"

