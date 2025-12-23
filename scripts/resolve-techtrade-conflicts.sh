#!/usr/bin/env bash
set -e

echo "🧨 Resolving conflicts by accepting SafeImage/quarantine branch versions"

git checkout --theirs apps/web/app/api/admin/tech-trade
git checkout --theirs apps/web/app/api/tech-trade

git add apps/web/app/api/admin/tech-trade
git add apps/web/app/api/tech-trade

echo "✅ Conflicts resolved — committing merge"

git commit -m "merge: quarantine tech-trade API routes + SafeImage fixes"

echo "🏗️ Building web app"
pnpm --filter web build

echo "🟢 MERGE COMPLETE — repo stabilized"

