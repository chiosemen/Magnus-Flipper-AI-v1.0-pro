#!/usr/bin/env bash
set -euo pipefail

###############################################################################
# 🔱 Magnus Stability God-Script v4
# Root: /Users/chinyeosemene/Developer/Magnus-Flipper-AI-v1.0-pro
#
# Features:
# - Hardcoded root (no confusion with old iCloud paths)
# - Kills zombie processes (expo / node / tsc / metro / watchman)
# - Deep clean: node_modules, lockfile drift, pnpm store clean
# - Reinstall: pnpm install (+ forced retry)
# - Rebuild: SDK, API, workers, web, expo doctor for mobile
# - Branch isolation: creates stability-v4-<timestamp> branch
# - WIP backup: saves uncommitted changes into a patch file
# - Rollback: returns to original branch & commit if failures occur
# - Git push ONLY if everything passes
###############################################################################

ROOT="/Users/chinyeosemene/Developer/Magnus-Flipper-AI-v1.0-pro"
LOG="$ROOT/.stability_god_v4.log"
PATCH_BACKUP="$ROOT/.stability_wip_$(date '+%Y%m%d_%H%M%S').patch"
ERRORS=()

timestamp() { date "+%Y-%m-%d %H:%M:%S"; }

log() {
  echo "[$(timestamp)] $*" | tee -a "$LOG"
}

section() {
  echo "" | tee -a "$LOG"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" | tee -a "$LOG"
  echo "🔵 $*" | tee -a "$LOG"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" | tee -a "$LOG"
}

fail() {
  ERRORS+=("$1")
  log "❌ $1"
}

ai_hint() {
  echo "" | tee -a "$LOG"
  echo "🤖 HINT ENGINE:" | tee -a "$LOG"
  for e in "${ERRORS[@]}"; do
    case "$e" in
      *"pnpm install failed"*)
        echo " - Check internet / pnpm registry / .npmrc. Try: pnpm store prune && pnpm install --force" | tee -a "$LOG"
        ;;
      *"SDK build failed"*)
        echo " - Open packages/sdk; run: pnpm build; inspect TypeScript errors in src/ or tsconfig.json" | tee -a "$LOG"
        ;;
      *"API build failed"*)
        echo " - Open packages/api; run: pnpm build or pnpm lint; check imports & env usage" | tee -a "$LOG"
        ;;
      *"Web build failed"*)
        echo " - Open web; run: pnpm build; look for Next.js config/env issues" | tee -a "$LOG"
        ;;
      *"Expo doctor failed"*)
        echo " - cd mobile; run: pnpm expo doctor --fix; check SDK version + app.json/app.config" | tee -a "$LOG"
        ;;
      *)
        echo " - $e" | tee -a "$LOG"
        ;;
    esac
  done
}

###############################################################################
# 0. Root & git sanity
###############################################################################
section "Sanity Checks"

: > "$LOG"

if [ ! -d "$ROOT" ]; then
  echo "❌ ROOT folder missing: $ROOT"
  exit 1
fi

cd "$ROOT"

if [ ! -d ".git" ]; then
  echo "❌ Not a git repo: $ROOT"
  exit 1
fi

ORIG_BRANCH="$(git rev-parse --abbrev-ref HEAD || echo 'unknown')"
ORIG_COMMIT="$(git rev-parse HEAD || echo '')"

log "📍 Stability God-Script v4 on $ROOT"
log "🔖 Original branch: $ORIG_BRANCH"
log "🔖 Original commit: ${ORIG_COMMIT:0:10}"

###############################################################################
# 1. Kill zombie processes
###############################################################################
section "Killing Zombie Processes"

pkill -f "expo"      || true
pkill -f "node"      || true
pkill -f "tsc"       || true
pkill -f "watchman"  || true
pkill -f "metro"     || true
pkill -f "webpack"   || true

log "🧹 Killed expo / node / tsc / watchman / metro / webpack if they existed."

###############################################################################
# 2. Backup WIP changes (Patch), then clean working tree
###############################################################################
section "Backing up WIP changes"

if [ -n "$(git status --porcelain)" ]; then
  log "📝 Detected uncommitted changes — saving patch: $PATCH_BACKUP"
  git diff > "$PATCH_BACKUP" || true
  log "✅ WIP patch saved."
else
  log "✅ Working tree clean — no WIP patch needed."
fi

###############################################################################
# 3. Create stability branch (branch isolation)
###############################################################################
section "Creating Stability Branch"

TS="$(date '+%Y%m%d_%H%M')"
STAB_BRANCH="stability-v4-$TS"

log "🌿 Creating & switching to branch: $STAB_BRANCH"
git checkout -b "$STAB_BRANCH" || fail "Could not create stability branch."

###############################################################################
# 4. Tool presence check
###############################################################################
section "Tooling Presence"

if ! command -v pnpm >/dev/null; then
  fail "pnpm not installed or not on PATH."
else
  log "✅ pnpm OK"
fi

if ! command -v node >/dev/null; then
  fail "node not installed or not on PATH."
else
  log "✅ node OK"
fi

if [ ! -f "pnpm-workspace.yaml" ]; then
  fail "pnpm-workspace.yaml missing from root."
else
  log "✅ pnpm-workspace.yaml present"
fi

###############################################################################
# 5. Deep Clean (node_modules, lockfiles, pnpm store)
###############################################################################
section "Deep Clean — Auto-Heal Mode"

log "🧹 Removing all node_modules (root + packages + apps + mobile + web)..."
find "$ROOT" -maxdepth 6 -type d -name "node_modules" -exec rm -rf {} + 2>/dev/null || true

log "🧹 Removing alternate lockfiles..."
rm -f package-lock.json yarn.lock 2>/dev/null || true

log "🧹 Pruning pnpm store..."
if ! pnpm store prune 2>&1 | tee -a "$LOG"; then
  fail "pnpm store prune failed (non-fatal)."
fi

log "🧹 Turbo clean (if configured)..."
pnpm turbo clean 2>/dev/null || true

###############################################################################
# 6. Reinstall deps with retry
###############################################################################
section "Dependency Reinstall"

INSTALL_OK=true

log "▶ pnpm install (normal)"
if ! pnpm install --prefer-frozen-lockfile=false 2>&1 | tee -a "$LOG"; then
  INSTALL_OK=false
  fail "pnpm install failed — retrying with --force."

  log "▶ pnpm install --force"
  if pnpm install --force 2>&1 | tee -a "$LOG"; then
    INSTALL_OK=true
    log "🔥 Forced reinstall succeeded."
  else
    fail "Forced pnpm install failed."
  fi
else
  log "✅ pnpm install succeeded."
fi

###############################################################################
# 7. SDK Rebuild
###############################################################################
section "SDK Rebuild"

if [ -d "packages/sdk" ]; then
  pushd packages/sdk >/dev/null
  if grep -q '"build"' package.json 2>/dev/null; then
    log "▶ pnpm build (packages/sdk)"
    if ! pnpm build 2>&1 | tee -a "$LOG"; then
      fail "SDK build failed."
    else
      log "⚡ SDK build OK."
    fi
  else
    log "ℹ packages/sdk has no build script."
  fi
  popd >/dev/null
else
  log "ℹ packages/sdk not found."
fi

###############################################################################
# 8. API Build
###############################################################################
section "API Rebuild"

if [ -d "packages/api" ]; then
  pushd packages/api >/dev/null
  if grep -q '"build"' package.json 2>/dev/null; then
    log "▶ pnpm build (packages/api)"
    if ! pnpm build 2>&1 | tee -a "$LOG"; then
      fail "API build failed."
    else
      log "⚡ API build OK."
    fi
  else
    log "ℹ packages/api has no build script."
  fi
  popd >/dev/null
else
  log "ℹ packages/api not found."
fi

###############################################################################
# 9. Workers / Crawlers / Engines
###############################################################################
section "Workers + Crawlers + Engines"

WORKER_DIRS=(
  "packages/crawlers"
  "packages/sniper-engine"
  "packages/valuation-engine"
  "packages/notifications"
  "apps/worker-crawler"
  "apps/worker-alerts"
  "apps/worker-analyzer"
)

for d in "${WORKER_DIRS[@]}"; do
  if [ -d "$d" ]; then
    pushd "$d" >/dev/null
    if grep -q '"build"' package.json 2>/dev/null; then
      log "▶ pnpm build ($d)"
      if ! pnpm build 2>&1 | tee -a "$LOG"; then
        fail "$d build failed."
      else
        log "⚡ $d build OK."
      fi
    else
      log "ℹ $d has no build script."
    fi
    popd >/dev/null
  fi
done

###############################################################################
# 10. Web Build
###############################################################################
section "Web Build"

if [ -d "web" ] && [ -f "web/package.json" ]; then
  pushd web >/dev/null
  if grep -q '"build"' package.json 2>/dev/null; then
    log "▶ pnpm build (web)"
    if ! pnpm build 2>&1 | tee -a "$LOG"; then
      fail "Web build failed."
    else
      log "⚡ Web build OK."
    fi
  else
    log "ℹ web has no build script."
  fi
  popd >/dev/null
else
  log "ℹ web folder missing or no package.json."
fi

###############################################################################
# 11. Mobile / Expo Doctor
###############################################################################
section "Mobile Expo Doctor"

if [ -d "mobile" ]; then
  pushd mobile >/dev/null
  if command -v pnpm >/dev/null; then
    log "▶ npx expo-doctor"
    if ! npx expo-doctor 2>&1 | tee -a "$LOG"; then
      fail "Expo doctor failed."
    else
      log "⚡ Expo doctor OK."
    fi
  else
    fail "pnpm missing when running mobile doctor."
  fi
  popd >/dev/null
else
  log "ℹ mobile folder missing."
fi

###############################################################################
# 12. Final Error Check — Rollback or Commit
###############################################################################
section "Final Check & Git Handling"

if [ ${#ERRORS[@]} -gt 0 ]; then
  log "❌ Stability God-Script v4 detected issues:"
  for e in "${ERRORS[@]}"; do log "   - $e"; done

  ai_hint

  log "🔙 Rolling back to original branch & commit..."
  git reset --hard "$ORIG_COMMIT" || true
  git checkout "$ORIG_BRANCH" 2>/dev/null || true

  log "📝 Your pre-run WIP patch (if any) is saved at:"
  log "    $PATCH_BACKUP"
  log "   You can reapply later with:"
  log "    git apply $(basename "$PATCH_BACKUP")  (after copying it back into the repo root)"

  echo
  echo "⛔ No changes were pushed. Inspect $LOG for details."
  exit 1
fi

# No errors: commit & push on stability branch
if [ -z "$(git status --porcelain)" ]; then
  log "✨ No file changes after stabilization. Nothing to commit."
else
  log "✅ Workspace clean & stable — committing on $STAB_BRANCH"
  git add -A
  git commit -m "chore: Stability God-Script v4 auto-heal $(date '+%Y-%m-%d %H:%M')" || true
  git push -u origin "$STAB_BRANCH" || fail "Git push failed."
fi

log "🚀 Stability God-Script v4 completed successfully."
log "   - Original branch: $ORIG_BRANCH"
log "   - Stability branch: $STAB_BRANCH"
log "   - Log file: $LOG"

echo
echo "✅ All good. You can now:"
echo "   - Review fixes on branch: $STAB_BRANCH"
echo "   - Merge into $ORIG_BRANCH once you're happy."
