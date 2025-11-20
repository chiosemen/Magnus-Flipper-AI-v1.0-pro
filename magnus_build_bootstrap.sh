#!/usr/bin/env bash
set -euo pipefail

###############################################################################
# 🔥 Magnus Flipper Build Bootstrap v1
# - Hardcoded root: /Users/chinyeosemene/Developer/Magnus-Flipper-AI-v1.0-pro
# - Bootstraps deps, runs core builds, detects common errors
# - Light auto-fix retries
# - Auto-commit + push to git if everything is green
###############################################################################

ROOT="/Users/chinyeosemene/Developer/Magnus-Flipper-AI-v1.0-pro"
LOG="$ROOT/.magnus_build_bootstrap.log"
STEP_ERRORS=()

timestamp() { date "+%Y-%m-%d %H:%M:%S"; }

log() {
  echo "[$(timestamp)] $*" | tee -a "$LOG"
}

section() {
  echo "" | tee -a "$LOG"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" | tee -a "$LOG"
  echo "🔹 $*" | tee -a "$LOG"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" | tee -a "$LOG"
}

fail_step() {
  local msg="$1"
  STEP_ERRORS+=("$msg")
  log "❌ $msg"
}

###############################################################################
# 0. Header
###############################################################################
echo "" > "$LOG"
section "Magnus Flipper Build Bootstrap v1"
log "Using ROOT: $ROOT"

###############################################################################
# 1. Sanity checks
###############################################################################
section "Sanity Checks"

if [ ! -d "$ROOT" ]; then
  log "❌ Root folder not found at $ROOT"
  exit 1
fi

cd "$ROOT"

if [ ! -d ".git" ]; then
  log "❌ This folder is NOT a git repo (.git missing). Aborting."
  exit 1
fi

if ! command -v pnpm >/dev/null 2>&1; then
  log "❌ pnpm not found. Install with: corepack enable && corepack prepare pnpm@latest --activate"
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  log "❌ node not found. Install Node.js (v20+ recommended)."
  exit 1
fi

BRANCH="$(git rev-parse --abbrev-ref HEAD || echo 'UNKNOWN')"
log "✅ Git repo detected on branch: $BRANCH"

###############################################################################
# 2. Workspace + package sanity
###############################################################################
section "Workspace & Package Sanity"

if [ ! -f "pnpm-workspace.yaml" ]; then
  fail_step "pnpm-workspace.yaml missing – workspace config not found."
else
  log "✅ pnpm-workspace.yaml present."
fi

if [ ! -f "package.json" ]; then
  log "❌ Root package.json is missing – this shouldn't happen."
  exit 1
else
  log "✅ Root package.json present."
fi

###############################################################################
# 3. Install dependencies (with auto-fix retry)
###############################################################################
section "Installing Dependencies (pnpm install)"

INSTALL_OK=true

log "▶ Running: pnpm install"
if ! pnpm install 2>&1 | tee -a "$LOG"; then
  INSTALL_OK=false
  fail_step "Initial pnpm install failed – attempting auto-fix (retry with --force)."

  log "🧹 Auto-fix: retrying pnpm install with --force"
  if pnpm install --force 2>&1 | tee -a "$LOG"; then
    log "✅ pnpm install --force succeeded on retry."
    INSTALL_OK=true
  else
    fail_step "pnpm install --force failed. Manual intervention required."
  fi
else
  log "✅ pnpm install completed successfully."
fi

if [ "$INSTALL_OK" = false ]; then
  log "❌ Dependency installation did not fully succeed. Skipping builds & git push."
  exit 1
fi

###############################################################################
# 4. Core Builds (root, web, mobile)
###############################################################################
section "Core Build: Root (turbo/pnpm build if present)"

ROOT_BUILD_OK=true

if grep -q '"build"' package.json; then
  log "▶ Root has a build script – running: pnpm build (this may use turbo)."
  if ! pnpm build 2>&1 | tee -a "$LOG"; then
    ROOT_BUILD_OK=false
    fail_step "Root build (pnpm build) failed."
  else
    log "✅ Root build succeeded."
  fi
else
  log "ℹ No root build script found in package.json – skipping root build."
fi

###############################################################################
# 4a. Web app build (skipped - already built by turbo in root build)
###############################################################################
section "Core Build: Web App"

WEB_BUILD_OK=true

if [ -d "web" ] && [ -f "web/package.json" ]; then
  log "ℹ Web app build handled by turbo in root build – skipping redundant build."
else
  log "ℹ web/ folder or web/package.json not found – skipping web build."
fi

###############################################################################
# 4b. Mobile sanity check (Expo doctor)
###############################################################################
section "Core Check: Mobile Expo Doctor"

MOBILE_OK=true

if [ -d "mobile" ] && [ -f "mobile/package.json" ]; then
  pushd mobile >/dev/null

  if command -v npx >/dev/null 2>&1; then
    log "▶ Running Expo doctor: npx expo-doctor"

    # Run expo-doctor and capture output to temp file to avoid pipe issues
    EXPO_TEMP="/tmp/expo_doctor_$$.txt"
    npx expo-doctor > "$EXPO_TEMP" 2>&1
    EXPO_EXIT=$?
    cat "$EXPO_TEMP" | tee -a "$LOG"

    # Check for critical issues (more than just CNG warning)
    CRITICAL_ISSUES=$(grep -c "check.* failed" "$EXPO_TEMP" || true)
    CNG_ONLY=$(grep -c "non-CNG project" "$EXPO_TEMP" || true)

    rm -f "$EXPO_TEMP"

    if [ "$EXPO_EXIT" -ne 0 ] && { [ "$CRITICAL_ISSUES" -gt 1 ] || { [ "$CRITICAL_ISSUES" -eq 1 ] && [ "$CNG_ONLY" -eq 0 ]; }; }; then
      MOBILE_OK=false
      fail_step "Expo doctor reported critical issues in mobile."
    else
      log "✅ Expo doctor passed for mobile (non-CNG warning is informational)."
    fi
  else
    log "ℹ npx not available – skipping Expo doctor."
  fi

  popd >/dev/null
else
  log "ℹ mobile/ folder or mobile/package.json not found – skipping mobile checks."
fi

###############################################################################
# 5. Env file sanity + auto-skeleton
###############################################################################
section "Environment File Sanity"

ENV_WARN=false

# Root .env
if [ ! -f ".env" ]; then
  log "ℹ .env missing at root – creating placeholder."
  cat > .env << 'EOF'
# Root .env placeholder for Magnus Flipper
# Add REAL secrets before running in production.
DATABASE_URL="postgres://replace_me"
EMAIL_USER="replace_me"
EMAIL_PASSWORD="replace_me"
EOF
  ENV_WARN=true
  log "✅ Created root .env placeholder."
else
  log "✅ Root .env exists."
fi

# Web .env.local
if [ -d "web" ]; then
  if [ ! -f "web/.env.local" ]; then
    log "ℹ web/.env.local missing – creating placeholder."
    cat > web/.env.local << 'EOF'
# Web .env.local placeholder
NEXT_PUBLIC_SUPABASE_URL="https://replace-me.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="replace_me"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="http://localhost:3000/api"
EOF
    ENV_WARN=true
    log "✅ Created web/.env.local placeholder."
  else
    log "✅ web/.env.local exists."
  fi
fi

# Mobile .env.development
if [ -d "mobile" ]; then
  if [ ! -f "mobile/.env.development" ]; then
    log "ℹ mobile/.env.development missing – creating placeholder."
    cat > mobile/.env.development << 'EOF'
# Mobile .env.development placeholder
EXPO_PUBLIC_API_URL="http://localhost:3000"
EXPO_PUBLIC_SUPABASE_URL="https://replace-me.supabase.co"
EXPO_PUBLIC_SUPABASE_ANON_KEY="replace_me"
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY="replace_me"
EXPO_PUBLIC_ENV="development"
EOF
    ENV_WARN=true
    log "✅ Created mobile/.env.development placeholder."
  else
    log "✅ mobile/.env.development exists."
  fi
fi

if [ "$ENV_WARN" = true ]; then
  fail_step "Env placeholders were created. You MUST replace them with real values before production."
fi

###############################################################################
# 6. Summary of build status
###############################################################################
section "Build & Check Summary"

log "Root build OK:   $ROOT_BUILD_OK"
log "Web build OK:    $WEB_BUILD_OK"
log "Mobile check OK: $MOBILE_OK"

if [ "${#STEP_ERRORS[@]}" -gt 0 ]; then
  echo "" | tee -a "$LOG"
  log "⚠ The following issues were detected:"
  for e in "${STEP_ERRORS[@]}"; do
    log "   - $e"
  done
  log "❌ Because of the above, git commit & push will be SKIPPED."
  log "📄 Full log: $LOG"
  exit 1
else
  log "✅ All tracked steps passed (with no critical errors). Proceeding to git stage/commit/push."
fi

###############################################################################
# 7. Git commit & push (auto)
###############################################################################
section "Git Commit & Push"

# See if there are any changes
if [ -z "$(git status --porcelain)" ]; then
  log "ℹ No git changes detected – nothing to commit or push."
  log "🎉 Build bootstrap complete with clean working tree."
  exit 0
fi

log "▶ Staging changes (git add -A)"
git add -A

# Generate a concise commit message with timestamp
COMMIT_MSG="chore: Magnus Flipper build bootstrap $(date '+%Y-%m-%d %H:%M')"

log "▶ Committing: $COMMIT_MSG"
if ! git commit -m "$COMMIT_MSG" 2>&1 | tee -a "$LOG"; then
  fail_step "Git commit failed – check git status manually."
  log "❌ Skipping push due to commit error."
  exit 1
fi

# Check if origin exists
if git remote get-url origin >/dev/null 2>&1; then
  log "▶ Pushing to origin/$BRANCH"
  if git push origin "$BRANCH" 2>&1 | tee -a "$LOG"; then
    log "✅ Git push succeeded."
    log "🎉 Magnus Flipper Build Bootstrap finished successfully."
  else
    fail_step "Git push failed – check your remote or network."
    log "⚠ Commit is local only. Please resolve push issues manually."
    exit 1
  fi
else
  log "ℹ No 'origin' remote configured – skipping push."
  log "✅ Commit created locally. Configure remote and push manually if desired."
fi

exit 0
