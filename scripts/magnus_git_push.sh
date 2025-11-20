#!/usr/bin/env bash
set -e

ROOT="/Users/chinyeosemene/Developer/Magnus-Flipper-AI-v1.0-pro"

echo "============================================"
echo "🔥 MAGNUS GIT PUSH SCRIPT"
echo "============================================"

cd "$ROOT"

# Check repo
if ! git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
  echo "❌ ERROR: Not inside a Git repo!"
  exit 1
fi

# Show current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "📍 Current branch: $CURRENT_BRANCH"

# Check for changes
if [ -z "$(git status --porcelain)" ]; then
  echo "✅ No changes to commit - working tree is clean"

  # Check if we need to push
  LOCAL=$(git rev-parse HEAD)
  REMOTE=$(git rev-parse origin/$CURRENT_BRANCH 2>/dev/null || echo "")

  if [ "$LOCAL" != "$REMOTE" ] && [ -n "$REMOTE" ]; then
    echo "🔄 Local commits ahead of remote, pushing..."
    git push origin "$CURRENT_BRANCH"
    echo "✅ PUSH COMPLETE"
  else
    echo "✅ Already up to date with remote"
  fi
  exit 0
fi

echo "📦 Staging changes..."
git add -A

echo "📝 Creating commit..."
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
git commit -m "Magnus auto-commit at $TIMESTAMP" || {
  echo "⚠️ No changes to commit."
}

echo "🔄 Pulling latest..."
git pull --rebase origin "$CURRENT_BRANCH" || {
  echo "❌ Pull failed — FIX MERGE CONFLICTS!"
  exit 1
}

echo "🚀 Pushing to origin/$CURRENT_BRANCH..."
git push origin "$CURRENT_BRANCH"

echo "============================================"
echo "✅ PUSH COMPLETE"
echo "============================================"
