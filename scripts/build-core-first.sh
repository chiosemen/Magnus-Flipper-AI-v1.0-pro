#!/bin/bash
# Build core first, then everything else

set -e

echo "🔨 Building @magnus-flipper-ai/core first..."
cd packages/core
pnpm build
cd ../..

echo "✅ Core built. Now building rest of workspace..."
pnpm --filter '!@magnus-flipper-ai/canary-*' --filter '!@magnus-flipper-ai/magnus-web-dashboard' -r build

echo "✅ All builds complete!"
