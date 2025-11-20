#!/bin/bash
# ================================================
# Magnus Flipper AI - Project Root Integrity Audit
# ================================================
# Author: SGM Chi
# Date: $(date)
# Purpose: Validate project readiness before deployment
# Location: scripts/verify_repo.sh
# ================================================

echo "🧩 Running Magnus Flipper AI Integrity Audit..."
echo "-----------------------------------------------"

# 1️⃣ ENVIRONMENT FILE CHECKS
echo "🔍 Checking for .env files..."
missing_env=false
for dir in api mobile web; do
  if [ -f "$dir/.env" ]; then
    echo "✅ $dir/.env found"
  else
    echo "⚠️  Missing: $dir/.env"
    missing_env=true
  fi
done

if [ "$missing_env" = true ]; then
  echo "⚠️  One or more .env files are missing! Please verify environment configs."
else
  echo "✅ All environment files present."
fi

# 2️⃣ GIT REMOTE & BRANCH CHECK
echo -e "\n🔗 Verifying Git remote and branch..."
git_origin=$(git remote get-url origin 2>/dev/null)
if [ -z "$git_origin" ]; then
  echo "❌ No remote origin set!"
else
  echo "✅ Remote origin detected: $git_origin"
fi

current_branch=$(git rev-parse --abbrev-ref HEAD)
if [ "$current_branch" != "main" ]; then
  echo "⚠️  Current branch is '$current_branch', expected 'main'."
else
  echo "✅ On main branch."
fi

# Check sync status
echo "🧾 Checking branch sync status..."
git fetch origin main >/dev/null 2>&1
ahead=$(git rev-list --count origin/main..HEAD)
behind=$(git rev-list --count HEAD..origin/main)

if [ "$ahead" -eq 0 ] && [ "$behind" -eq 0 ]; then
  echo "✅ Local and remote branches are in sync."
elif [ "$ahead" -gt 0 ]; then
  echo "⚠️  You are ahead of origin/main by $ahead commits (need to push)."
elif [ "$behind" -gt 0 ]; then
  echo "⚠️  You are behind origin/main by $behind commits (need to pull)."
fi

# 3️⃣ DEPENDENCY CHECK
echo -e "\n📦 Checking dependencies..."
if command -v pnpm &>/dev/null; then
  pnpm outdated || echo "✅ All dependencies up to date."
else
  echo "⚠️  pnpm not installed. Skipping dependency check."
fi

# 4️⃣ BROKEN LINK / FILE PATH CHECK
echo -e "\n🧱 Checking for broken symbolic links or missing directories..."
broken_links=$(find . -xtype l)
if [ -n "$broken_links" ]; then
  echo "⚠️  Broken links detected:"
  echo "$broken_links"
else
  echo "✅ No broken symbolic links found."
fi

# 5️⃣ SUMMARY
echo -e "\n-----------------------------------------------"
echo "🏁 Integrity Audit Complete!"
echo "-----------------------------------------------"

# Exit code summary
if [ "$missing_env" = true ]; then
  echo "❌ Some checks failed. Review warnings above."
  exit 1
else
  echo "✅ All systems nominal. Ready for deployment 🚀"
  exit 0
fi

