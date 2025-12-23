#!/usr/bin/env bash
set -e

echo "🪦 Quarantining tech-trade-core (v2)"

PKG="packages/tech-trade-core"

# Ensure dist exists
mkdir -p $PKG/dist

# Disable build script safely
jq '.scripts.build="echo \"tech-trade-core quarantined\""' \
  $PKG/package.json > /tmp/pkg.json \
  && mv /tmp/pkg.json $PKG/package.json

# Stub outputs so imports never explode
cat <<EOF > $PKG/dist/index.js
throw new Error("tech-trade-core is quarantined");
EOF

cat <<EOF > $PKG/dist/index.d.ts
export {};
EOF

# Remove from Next transpilation (safe even if already removed)
sed -i '' '/tech-trade-core/d' apps/web/next.config.js || true

git add $PKG apps/web/next.config.js
git commit -m "chore: quarantine tech-trade-core (hard disabled)" || true

echo "✅ tech-trade-core fully quarantined"

