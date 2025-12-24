#!/usr/bin/env bash
set -e

echo "🛡️  PRE-VERCEL CHECKLIST"
echo "------------------------"

echo "1️⃣ Installing deps"
pnpm install

echo "2️⃣ Type check"
pnpm lint

echo "3️⃣ Production build"
pnpm build

echo ""
echo "✅ ALL CHECKS PASSED"
echo "You may now push safely."

