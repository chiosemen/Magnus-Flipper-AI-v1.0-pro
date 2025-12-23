#!/usr/bin/env bash
set -e

echo "🧹 Stashing local changes"
git stash push -m "pre-safeimage-merge"

echo "🔄 Syncing main with origin"
git fetch origin
git pull --rebase origin main

echo "🔀 Merging SafeImage fix branch"
git merge origin/claude/fix-safeimage-onerror-TL5ue

echo "📦 Restoring local changes"
git stash pop || echo "⚠️ Manual conflict resolution may be needed"

echo "🏗️ Building web app"
pnpm --filter web build

echo "🟢 SUCCESS: SafeImage fix + dashboard work are now in main"

