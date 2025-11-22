#!/bin/bash

set -e

echo ""
echo "🔍 Detecting all remote claude/* branches..."
BRANCHES=$(git branch -r | grep 'origin/claude/' | sed 's|origin/||')

if [ -z "$BRANCHES" ]; then
  echo "✅ No claude/* branches found. Nothing to delete."
else
  echo "🧹 Preparing to delete the following remote branches:"
  echo "$BRANCHES"
  echo ""

  echo "🔥 Deleting claude/* branches from remote..."
  for BR in $BRANCHES; do
    echo "   → Deleting $BR"
    git push origin --delete "$BR" || true
  done
fi

echo ""
echo "🧨 Deleting clean-rebuild-v1 (if present)..."
git push origin --delete clean-rebuild-v1 || true

echo ""
echo "🪓 Pruning local tracking references..."
git remote prune origin

echo ""
echo "📋 Remaining branches:"
git branch -a

echo ""
echo "🚀 Cleanup complete, SGM CHI M5."
