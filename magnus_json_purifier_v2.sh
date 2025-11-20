#!/usr/bin/env bash
#
# 🔧 Magnus JSON Purifier v2
# - Scans JSON files
# - Removes BOM + invisible Unicode chars
# - Validates with jq
# - Creates backups of everything it touches
#
# Usage:
#   ./magnus_json_purifier_v2.sh               # scan entire repo
#   ./magnus_json_purifier_v2.sh package.json  # scan specific files
#   DRY_RUN=1 ./magnus_json_purifier_v2.sh     # just report, no writes

set -euo pipefail

ROOT_DIR="$(pwd)"
BACKUP_ROOT="$ROOT_DIR/.magnus_backups/json_purifier_v2_$(date +%Y%m%d_%H%M%S)"
DRY_RUN="${DRY_RUN:-0}"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 MAGNUS JSON PURIFIER v2"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📁 Root:   $ROOT_DIR"
echo "📦 Backup: $BACKUP_ROOT"
echo "🧪 Dry run: ${DRY_RUN}"
echo

mkdir -p "$BACKUP_ROOT"

# Small helper to create a backup path mirroring repo structure
backup_path_for() {
  local file="$1"
  local rel="${file#"$ROOT_DIR"/}"
  echo "$BACKUP_ROOT/$rel"
}

# Sanitize a single JSON file
sanitize_json_file() {
  local file="$1"

  echo "----------------------------------------------------"
  echo "🔍 Checking: $file"

  if [[ ! -f "$file" ]]; then
    echo "  ⚠️  File does not exist, skipping."
    return
  fi

  # First, quick validation
  if jq -e '.' "$file" >/dev/null 2>&1; then
    echo "  ✅ Valid JSON (no action needed)"
    return
  else
    echo "  ❌ Invalid JSON detected — attempting purification…"
  fi

  if [[ "$DRY_RUN" == "1" ]]; then
    echo "  🧪 DRY RUN: would attempt to clean hidden characters and revalidate."
    return
  fi

  local backup
  backup="$(backup_path_for "$file")"
  mkdir -p "$(dirname "$backup")"
  cp "$file" "$backup"
  echo "  💾 Backup created at: $backup"

  # Create a working temp file
  local tmp="$file.magnus_tmp"
  cp "$file" "$tmp"

  # 1) Strip UTF-8 BOM if present
  # 2) Remove zero-width + invisible Unicode characters
  # 3) Normalize CRLF → LF
  perl -0pi -e 's/^\xEF\xBB\xBF//' "$tmp"
  perl -0pi -e 's/[\x{200B}\x{200C}\x{200D}\x{2060}\x{FEFF}]/ /g' "$tmp"
  perl -0pi -e 's/\r\n/\n/g' "$tmp"

  # Try validate again
  if jq -e '.' "$tmp" >/dev/null 2>&1; then
    echo "  ✅ Purified JSON is now valid — writing back."
    mv "$tmp" "$file"
    return
  fi

  echo "  ⚠️ Purified file is still invalid JSON."
  echo "  🔎 jq error:"
  jq -e '.' "$tmp" >/dev/null 2>&1 || true

  echo "  ❗ Keeping backup at: $backup"
  echo "  ❗ Leaving original file unchanged for manual fix."
  rm -f "$tmp"
}

# Collect target files
TARGET_FILES=()

if [[ "$#" -gt 0 ]]; then
  # Specific files passed as arguments
  for arg in "$@"; do
    if [[ -d "$arg" ]]; then
      # Directory: scan inside
      while IFS= read -r -d '' f; do
        TARGET_FILES+=("$f")
      done < <(find "$arg" -type f -name "*.json" -print0)
    else
      TARGET_FILES+=("$arg")
    fi
  done
else
  # No args → scan whole repo (excluding heavy dirs)
  while IFS= read -r -d '' f; do
    TARGET_FILES+=("$f")
  done < <(
    find "$ROOT_DIR" -type f -name "*.json" \
      -not -path "*/node_modules/*" \
      -not -path "*/.git/*" \
      -not -path "*/.next/*" \
      -not -path "*/dist/*" \
      -print0
  )
fi

echo "📂 Files to scan: ${#TARGET_FILES[@]}"
if [[ "${#TARGET_FILES[@]}" -eq 0 ]]; then
  echo "  ⚠️ No JSON files found. Exiting."
  exit 0
fi

echo

BROKEN_COUNT=0
FIXED_COUNT=0
VALID_COUNT=0

for file in "${TARGET_FILES[@]}"; do
  # We want granular feedback → re-run checks per file
  if jq -e '.' "$file" >/dev/null 2>&1; then
    echo "----------------------------------------------------"
    echo "🔍 Checking: $file"
    echo "  ✅ Already valid JSON"
    ((VALID_COUNT++)) || true
    continue
  fi

  # Invalid → try to purify
  sanitize_json_file "$file"

  if jq -e '.' "$file" >/dev/null 2>&1; then
    ((FIXED_COUNT++)) || true
  else
    ((BROKEN_COUNT++)) || true
  fi
done

echo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 MAGNUS JSON PURIFIER v2 — SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ Valid (unchanged):  $VALID_COUNT"
echo "  🔧 Fixed via purifier: $FIXED_COUNT"
echo "  ❌ Still broken:       $BROKEN_COUNT"
echo "  💾 Backups folder:     $BACKUP_ROOT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Done."
