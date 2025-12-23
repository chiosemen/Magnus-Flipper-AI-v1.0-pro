#!/usr/bin/env bash
set -e

echo "🧠 Enforcing branch discipline"

# Always reset to main
git checkout main
git fetch origin
git reset --hard origin/main

# Delete stray local branches except main
git branch | grep -v "main" | xargs -n 1 git branch -D || true

echo "✅ Branch discipline enforced"

