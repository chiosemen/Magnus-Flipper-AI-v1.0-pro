#!/usr/bin/env bash
set -euo pipefail

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔥 MAGNUS MONOREPO RESURRECTOR"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

echo "📁 Repo root: $ROOT_DIR"
echo

# 1) Basic structure checks
echo "🔎 Checking monorepo skeleton…"

REQUIRED_FILES=(
  "package.json"
  "pnpm-workspace.yaml"
  "turbo.json"
)
REQUIRED_DIRS=(
  "api"
  "db"
  "infra"
  "shared"
  "scripts"
)

MISSING=false

for f in "${REQUIRED_FILES[@]}"; do
  if [ ! -f "$f" ]; then
    echo "  ❌ Missing file: $f"
    MISSING=true
  else
    echo "  ✅ Found file: $f"
  fi
done

for d in "${REQUIRED_DIRS[@]}"; do
  if [ ! -d "$d" ]; then
    echo "  ❌ Missing dir: $d"
    MISSING=true
  else
    echo "  ✅ Found dir: $d"
  fi
done

if [ "$MISSING" = true ]; then
  echo
  echo "⚠️  Some core files/dirs are missing. The monorepo may still be recoverable,"
  echo "    but double-check against the original GitHub repo before pushing."
fi

echo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 Web app folder sanity (web / magnus-web-dashboard)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -d "web" ]; then
  echo "✅ 'web' directory exists."
else
  if [ -d "magnus-web-dashboard" ]; then
    echo "⚠️ 'web' is missing, but 'magnus-web-dashboard' exists."
    echo "   → Moving 'magnus-web-dashboard' → 'web'"
    mv magnus-web-dashboard web
    echo "   ✅ Renamed 'magnus-web-dashboard' → 'web'"
  else
    echo "❌ Neither 'web' nor 'magnus-web-dashboard' exist. Web frontend missing."
  fi
fi

if [ -d "web" ]; then
  echo "🔎 Inspecting web/package.json…"
  if [ -f "web/package.json" ]; then
    if command -v jq >/dev/null 2>&1; then
      if jq empty web/package.json 2>/dev/null; then
        echo "   ✅ web/package.json is valid JSON."
      else
        echo "   ❌ web/package.json is invalid JSON."
      fi
    else
      echo "   ⚠️ jq not installed, skipping JSON validation."
    fi
  else
    echo "   ❌ web/package.json is missing."
  fi
fi

echo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📱 Mobile app folder sanity (mobile)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -d "mobile" ]; then
  echo "✅ 'mobile' directory exists."
  if [ -f "mobile/package.json" ]; then
    if command -v jq >/dev/null 2>&1; then
      if jq empty mobile/package.json 2>/dev/null; then
        echo "   ✅ mobile/package.json is valid JSON."
      else
        echo "   ❌ mobile/package.json is invalid JSON."
      fi
    else
      echo "   ⚠️ jq not installed, skipping JSON validation."
    fi
  else
    echo "   ❌ mobile/package.json is missing."
  fi
else
  echo "❌ 'mobile' directory is missing."
fi

echo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 Root dependency install (pnpm install)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if command -v pnpm >/dev/null 2>&1; then
  echo "▶️  Running: pnpm install (workspace root)…"
  pnpm install
  echo "✅ Root pnpm install complete."
else
  echo "❌ pnpm is not installed. Install with: corepack enable && corepack use pnpm@latest"
  exit 1
fi

echo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 Subproject installs (web & mobile)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -d "web" ] && [ -f "web/package.json" ]; then
  echo "▶️  Running: pnpm --filter web install"
  pnpm --filter web install || echo "⚠️ web install had issues, check logs above."
else
  echo "⚠️ Skipping web install (web or web/package.json missing)."
fi

if [ -d "mobile" ] && [ -f "mobile/package.json" ]; then
  echo "▶️  Running: pnpm --filter mobile install"
  pnpm --filter mobile install || echo "⚠️ mobile install had issues, check logs above."
else
  echo "⚠️ Skipping mobile install (mobile or mobile/package.json missing)."
fi

echo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧠 Git status (read-only)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -d ".git" ]; then
  CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'UNKNOWN')"
  echo "📌 Current branch: $CURRENT_BRANCH"

  echo
  echo "🔗 Remotes:"
  git remote -v || echo "   (no remotes configured)"

  echo
  echo "📊 Working tree changes:"
  git status --short || echo "   (git status failed, but .git exists.)"

  echo
  echo "ℹ️  To commit & push manually after checking everything:"
  echo "    git add ."
  echo "    git commit -m \"Resurrect monorepo state\""
  echo "    git push origin $CURRENT_BRANCH"
else
  echo "⚠️ No .git directory found. Repo not initialized here."
  echo "   To initialize and link to GitHub:"
  echo "   git init"
  echo "   git remote add origin git@github.com:chiosemen/Magnus-Flipper-AI-v1.0-.git"
  echo "   git add ."
  echo "   git commit -m \"Initial resurrected import\""
  echo "   git push -u origin master"
fi

echo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Magnus Monorepo Resurrector finished."
echo "   Next suggested steps:"
echo "   • For web:   cd web   && pnpm dev"
echo "   • For mobile: cd mobile && pnpm expo start --dev-client"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
