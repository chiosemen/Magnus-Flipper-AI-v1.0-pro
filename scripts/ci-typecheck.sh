#!/usr/bin/env bash
set -euo pipefail

echo "[ci:typecheck] Running workspace build (if present)..."
pnpm -r --workspace-concurrency 1 run build --if-present || true

echo "[ci:typecheck] Running web build..."
pnpm --filter @magnus/web build

echo "[ci:typecheck] Running web tests..."
pnpm --filter @magnus/web test -- --run

echo "[ci:typecheck] Running mobile tests..."
pnpm --filter magnus-flipper-mobile test
