#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "🚀 Magnus Vercel Deploy"

bash scripts/magnus_vercel_repair.sh

npx vercel deploy --prod --archive=tgz

echo "✅ Deploy complete"
