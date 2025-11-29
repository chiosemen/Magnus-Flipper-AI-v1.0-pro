#!/usr/bin/env bash

echo "🔥 SGM CHI M5 — Healing pnpm workspace + Vercel build issues..."

### 1. REWRITE pnpm-workspace.yaml EXACTLY ###
cat << 'EOF' > pnpm-workspace.yaml
packages:
  - "apps/*"
  - "packages/*"
EOF
echo "✅ pnpm-workspace.yaml rewritten"


### 2. NORMALIZE ALL PACKAGES ###
for pkg in packages/*; do
  if [ -d "$pkg" ] && [ -f "$pkg/package.json" ]; then
    echo "🔧 Fixing $pkg/package.json"

    tmp="$pkg/package.tmp.json"

    jq '
      .main="src/index.ts" |
      .types="src/index.ts" |
      .exports={"." : "./src/index.ts", "./*":"./src/*"} |
      .files=["src"] |
      .private=true
    ' "$pkg/package.json" > "$tmp"

    mv "$tmp" "$pkg/package.json"
  fi
done
echo "✅ All package.json files healed"


### 3. FORCE Next.js TO TRANSPILE ALL PACKAGES ###
cat << 'EOF' > apps/web/next.config.js
/** @type {import("next").NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@magnus-flipper-ai/core",
    "@magnus-flipper-ai/ui",
    "@magnus-flipper-ai/ui-config",
    "@magnus-flipper-ai/shared",
    "@magnus-flipper-ai/queue",
    "@magnus-flipper-ai/fb-marketplace-crawler",
    "@magnus-flipper-ai/notifications",
    "@magnus-flipper-ai/sniper-engine",
    "@magnus-flipper-ai/valuation-engine"
  ]
};

export default nextConfig;
EOF
echo "✅ next.config.js rewritten"


### 4. REMOVE BROKEN LOCKFILE ###
rm -f pnpm-lock.yaml
echo "🔥 Removed old pnpm lockfile"


### 5. REINSTALL CLEANLY ###
pnpm install
echo "🔥 Lockfile rebuilt cleanly"


### 6. COMMIT + PUSH ###
git add .
git commit -m "fix: full workspace rebuild for Vercel compatibility"
git push origin main

echo "🚀 Git push complete — deploying..."

### 7. DEPLOY ###
vercel --cwd apps/web --prod

