#!/usr/bin/env bash
set -euo pipefail

ROOT="/Users/chinyeosemene/Developer/Magnus-Flipper-AI-v1.0-pro"
SNAP_DIR="$ROOT/.namespace-snapshots"

if [ ! -d "$SNAP_DIR" ]; then
  echo "No snapshots found."
  exit 0
fi

for dir in "$SNAP_DIR"/*; do
  [ -d "$dir" ] || continue
  ts=$(basename "$dir")
  count=$(find "$dir" -name package.json | wc -l | tr -d ' ')
  echo "$ts - $count package.json files"
done
