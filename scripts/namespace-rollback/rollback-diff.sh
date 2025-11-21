#!/usr/bin/env bash
set -euo pipefail

ROOT="/Users/chinyeosemene/Developer/Magnus-Flipper-AI-v1.0-pro"
SNAP_DIR="$ROOT/.namespace-snapshots"

if [ -z "${1:-}" ]; then
  echo "Usage: ./rollback-diff.sh <timestamp>"
  exit 1
fi

DIR="$SNAP_DIR/$1"
if [ ! -d "$DIR" ]; then
  echo "Snapshot $1 not found"
  exit 1
fi

diff -ru --color=always "$DIR" "$ROOT" || true
