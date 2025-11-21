#!/usr/bin/env bash
set -euo pipefail

ROOT="/Users/chinyeosemene/Developer/Magnus-Flipper-AI-v1.0-pro"
SNAP_DIR="$ROOT/.namespace-snapshots"
mkdir -p "$SNAP_DIR"

timestamp() {
  date +"%Y%m%d%H%M%S"
}

create_snapshot() {
  local ts
  ts=$(timestamp)
  local dir="$SNAP_DIR/$ts"
  mkdir -p "$dir"
  cp "$ROOT/pnpm-workspace.yaml" "$dir/pnpm-workspace.yaml"
  cp "$ROOT/turbo.json" "$dir/turbo.json"
  find "$ROOT" -name package.json -type f ! -path "*/node_modules/*" ! -path "*/.next/*" ! -path "*/dist/*" ! -path "*/.turbo/*" ! -path "*/.pnpm/*" ! -path "*/.expo/*" ! -path "*/build/*" ! -path "*/.magnus_backups/*" -exec bash -c 'mkdir -p "$(dirname "$1" | sed "s|'"$ROOT"'|'"$dir"'|")"; cp "$1" "$(echo "$1" | sed "s|'"$ROOT"'|'"$dir"'|")"' _ {} \;
  echo "$ts"
}

restore_snapshot() {
  local ts="$1"
  local dir="$SNAP_DIR/$ts"
  if [ ! -d "$dir" ]; then
    echo "❌ Snapshot $ts not found"
    exit 1
  fi
  cp "$dir/pnpm-workspace.yaml" "$ROOT/pnpm-workspace.yaml"
  cp "$dir/turbo.json" "$ROOT/turbo.json"
  find "$dir" -name package.json -type f -exec bash -c 'cp "$1" "$(echo "$1" | sed "s|'"$dir"'|'"$ROOT"'|")"' _ {} \;
}

if [[ "${1:-}" == "create" ]]; then
  snap=$(create_snapshot)
  echo "✅ Snapshot created at $SNAP_DIR/$snap"
  exit 0
fi

if [[ -n "${1:-}" ]]; then
  echo "🔄 Restoring snapshot $1 ..."
  restore_snapshot "$1"
  echo "🔒 Validating with pnpm install --frozen-lockfile ..."
  cd "$ROOT"
  pnpm install --frozen-lockfile
  echo "✅ Restore complete."
  exit 0
fi

cat <<'EOF'
Usage:
  ./rollback.sh create         # create new snapshot
  ./rollback.sh <timestamp>    # restore snapshot
EOF
