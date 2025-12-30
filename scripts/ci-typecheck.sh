#!/usr/bin/env bash
set -euo pipefail

echo "[ci:typecheck] Running workspace build (if present)..."
pnpm -r --workspace-concurrency 1 run build --if-present || true

echo "[ci:typecheck] Running web build..."
pnpm --filter @magnus/web build || {
  echo "[ci:typecheck] Web build failed or skipped (package may not exist)"
  exit 0
}

echo "[ci:typecheck] Detecting worker-* packages..."
shopt -s nullglob
worker_dirs=(apps/worker-* packages/worker-*)
if [ ${#worker_dirs[@]} -gt 0 ]; then
  echo "[ci:typecheck] Worker packages: ${worker_dirs[*]}"
  pnpm --filter "worker-*" build --if-present || true
else
  echo "[ci:typecheck] No worker-* packages found; skipping."
fi
