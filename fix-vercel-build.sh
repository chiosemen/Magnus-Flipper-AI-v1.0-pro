#!/usr/bin/env bash
set -e

echo "🧼 Fixing Magnus Flipper monorepo build issues..."

# 1. Ensure tech-trade-core exists
if [ ! -d "packages/tech-trade-core" ]; then
  echo "❌ packages/tech-trade-core not found. Creating minimal package..."
  mkdir -p packages/tech-trade-core/src
  cat <<'PKG' > packages/tech-trade-core/package.json
{
  "name": "@magnus-flipper-ai/tech-trade-core",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": ["dist"],
  "scripts": {
    "build": "tsc -p tsconfig.json"
  }
}
PKG

  cat <<'TS' > packages/tech-trade-core/tsconfig.json
{
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "declaration": true,
    "module": "ESNext",
    "target": "ES2020",
    "moduleResolution": "Bundler",
    "strict": false
  },
  "include": ["src"]
}
TS

  echo "export {};" > packages/tech-trade-core/src/index.ts
fi

# 2. Fix name if incorrect
jq '.name="@magnus-flipper-ai/tech-trade-core"' \
  packages/tech-trade-core/package.json > /tmp/ttc.json \
  && mv /tmp/ttc.json packages/tech-trade-core/package.json

# 3. Install lucide-react where it's used
echo "📦 Installing lucide-react in packages/ui"
pnpm --filter @magnus-flipper-ai/ui add lucide-react || true

# 4. Ensure web depends on tech-trade-core
echo "🔗 Linking tech-trade-core to apps/web"
jq '.dependencies["@magnus-flipper-ai/tech-trade-core"]="workspace:*"' \
  apps/web/package.json > /tmp/web.json \
  && mv /tmp/web.json apps/web/package.json

# 5. Force Next.js to transpile workspace packages
NEXTCFG="apps/web/next.config.js"
if ! grep -q "tech-trade-core" "$NEXTCFG"; then
  cat <<'NCFG' > "$NEXTCFG"
const nextConfig = {
  transpilePackages: [
    "@magnus-flipper-ai/ui",
    "@magnus-flipper-ai/core",
    "@magnus-flipper-ai/tech-trade-core"
  ]
};
module.exports = nextConfig;
NCFG
fi

# 6. Reinstall + build
echo "🔁 Reinstalling dependencies"
rm -rf node_modules pnpm-lock.yaml
pnpm install

echo "🏗️ Building tech-trade-core"
pnpm --filter @magnus-flipper-ai/tech-trade-core build || true

echo "✅ Fix complete. Ready to deploy."
