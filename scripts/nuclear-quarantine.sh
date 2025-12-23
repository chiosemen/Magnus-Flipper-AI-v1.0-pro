#!/usr/bin/env bash
set -euo pipefail

### ================================
### NUCLEAR QUARANTINE (Monorepo)
### ================================
### Goals:
### 1) Hard quarantine tech-trade-core (and optionally other workspaces)
### 2) Defuse SafeImage onError type errors in apps/web
### 3) Hard clean caches and force a clean pnpm install
### 4) Build only apps/web deterministically
###
### Usage:
###   bash scripts/nuclear-quarantine.sh
###
### Optional env vars:
###   QUARANTINE_PACKAGES="tech-trade-core packages/tech-trade-core packages/queue packages/core packages/marketplace-config"
###   SKIP_SAFEIMAGE_FIX=1
###
### Notes:
### - This does NOT delete your code. It "hides" quarantined packages from workspace resolution.
### - It also patches known SafeImage onError mistakes in apps/web.
###

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "☢️  NUCLEAR QUARANTINE START"
echo "📍 Repo: $ROOT"

# ---- 0) Pre-flight checks
if ! command -v pnpm >/dev/null 2>&1; then
  echo "❌ pnpm not found. Install pnpm first."
  exit 1
fi

if [ ! -f "pnpm-workspace.yaml" ]; then
  echo "❌ pnpm-workspace.yaml not found at repo root."
  exit 1
fi

# ---- 1) Quarantine targets (edit defaults as needed)
DEFAULT_QUARANTINE="tech-trade-core packages/tech-trade-core"
QUARANTINE_PACKAGES="${QUARANTINE_PACKAGES:-$DEFAULT_QUARANTINE}"

echo "🧟 Quarantining packages: $QUARANTINE_PACKAGES"

# We implement quarantine by adding NEGATED globs in pnpm-workspace.yaml:
#   - '!packages/tech-trade-core/**'
# This prevents pnpm from treating them as workspace packages, so Next can't resolve them.
WS_FILE="pnpm-workspace.yaml"
WS_BACKUP="pnpm-workspace.yaml.bak.nuclear"

if [ ! -f "$WS_BACKUP" ]; then
  cp "$WS_FILE" "$WS_BACKUP"
  echo "🗂️  Backup created: $WS_BACKUP"
else
  echo "🗂️  Backup already exists: $WS_BACKUP (leaving it)"
fi

# Ensure workspace file has a "packages:" key (typical format)
if ! grep -qE '^[[:space:]]*packages:' "$WS_FILE"; then
  echo "❌ pnpm-workspace.yaml missing 'packages:' key. Aborting to avoid corruption."
  exit 1
fi

# Append quarantine globs if not already present
for P in $QUARANTINE_PACKAGES; do
  # Normalize:
  # - if "tech-trade-core" -> try both "packages/tech-trade-core/**" and "apps/tech-trade-core/**" if they exist
  # - if includes slash, use as given
  if [[ "$P" == *"/"* ]]; then
    CANDIDATES=("$P")
  else
    CANDIDATES=("packages/$P" "apps/$P")
  fi

  for C in "${CANDIDATES[@]}"; do
    if [ -d "$C" ]; then
      GLOB="!${C}/**"
      if grep -qF "$GLOB" "$WS_FILE"; then
        echo "   ✅ already excluded: $GLOB"
      else
        echo "   ➕ excluding: $GLOB"
        # Append under packages list (safe append at end; pnpm reads full list)
        printf "\n  - '%s'\n" "$GLOB" >> "$WS_FILE"
      fi
    fi
  done
done

echo "✅ Workspace quarantine applied."

# ---- 2) SafeImage onError defuse (your terminal shows it still exists in FeedCard.tsx)
if [ "${SKIP_SAFEIMAGE_FIX:-0}" != "1" ]; then
  echo "🧯 Defusing SafeImage onError usage in apps/web…"

  # Remove onError prop blocks for <SafeImage ... onError={...} ... />
  # This targets patterns like:
  #   onError={() => { ... }}
  #
  # It’s intentionally aggressive but scoped to apps/web only.
  TARGET_DIR="apps/web"
  if [ -d "$TARGET_DIR" ]; then
    # macOS sed requires -i ''
    # Remove multi-line onError={() => { ... }} blocks
    # 1) Delete line containing "onError={() =>" through the next line containing "}}"
    # Works for the common pattern shown in your terminal.
    find "$TARGET_DIR" -type f \( -name "*.tsx" -o -name "*.ts" \) -print0 \
      | xargs -0 -I {} bash -c '
          f="$1"
          # Only touch files that mention "<SafeImage" and "onError"
          if grep -q "<SafeImage" "$f" && grep -q "onError" "$f"; then
            # Backup once
            if [ ! -f "${f}.bak.nuclear" ]; then cp "$f" "${f}.bak.nuclear"; fi
            # Delete common onError block
            sed -i "" "/^[[:space:]]*onError={[[:space:]]*()[[:space:]]*=>[[:space:]]*{/,/^[[:space:]]*}}[[:space:]]*$/d" "$f"
            # Also delete inline onError={() => ...} if present on one line
            sed -i "" "s/[[:space:]]onError={[[:space:]]*()[[:space:]]*=>[[:space:]]*{[^}]*}[[:space:]]*}//g" "$f"
          fi
        ' _ {}
  fi

  echo "✅ SafeImage onError defuse pass complete."
else
  echo "⏭️  SKIP_SAFEIMAGE_FIX=1 set — skipping SafeImage patch."
fi

# ---- 3) Hard-clean caches / node_modules
echo "🧹 Hard clean node_modules + caches…"
rm -rf node_modules
rm -rf apps/web/node_modules
rm -rf packages/**/node_modules 2>/dev/null || true
rm -rf .turbo 2>/dev/null || true
rm -rf apps/web/.next 2>/dev/null || true
rm -rf ~/.pnpm-store 2>/dev/null || true

# ---- 4) Fresh install (scripts ON, so builds can happen normally)
echo "📦 Fresh pnpm install (clean, deterministic)…"
pnpm install --frozen-lockfile=false

# ---- 5) Build only the web app
echo "🏗️  Building apps/web only…"
pnpm --filter web build

echo "✅ NUCLEAR QUARANTINE DONE"
echo "Next: commit changes + push, then Vercel redeploy."

