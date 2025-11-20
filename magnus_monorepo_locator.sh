#!/bin/zsh
echo ""
echo "🔥 MAGNUS MONOREPO LOCATOR & VALIDATOR v4"
echo "--------------------------------------------"
echo ""

TARGET_NAME="Magnus-Flipper-AI-v1.0-pro"

echo "🔍 Searching for all directories named: $TARGET_NAME …"
echo ""

RESULTS=($(find $HOME -type d -name "$TARGET_NAME" 2>/dev/null))

if [ ${#RESULTS[@]} -eq 0 ]; then
    echo "❌ No matching directories found."
    exit 1
fi

echo "📂 Found ${#RESULTS[@]} possible repo locations:"
for r in "${RESULTS[@]}"; do
    echo "   - $r"
done
echo ""

VALID_REPOS=()

echo "🔎 Checking which ones are valid Git repositories…"
for r in "${RESULTS[@]}"; do
    if git -C "$r" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
        echo "✅ Git repo: $r"
        VALID_REPOS+=("$r")
    else
        echo "❌ Not a Git repo: $r"
    fi
done
echo ""

if [ ${#VALID_REPOS[@]} -eq 0 ]; then
    echo "❌ No valid Git repos found among the matches."
    exit 1
fi

echo "📦 Validating pnpm workspace structure…"
for r in "${VALID_REPOS[@]}"; do
    echo ""
    echo "➡️ Checking workspace at: $r"

    if pnpm -C "$r" -w list >/dev/null 2>&1; then
        echo "   ✅ pnpm workspace detected"
    else
        echo "   ❌ pnpm workspace missing or broken"
    fi
done
echo ""

echo "⚡ Checking turbo configuration…"
for r in "${VALID_REPOS[@]}"; do
    echo ""
    echo "➡️ Checking turbo at: $r"
    if command -v turbo >/dev/null 2>&1 && turbo run build --dry=json --cwd "$r" >/dev/null 2>&1; then
        echo "   ✅ Turbo pipeline detected"
    else
        echo "   ❌ Turbo not configured / turbo not installed / or pipeline broken in this folder"
    fi
done
echo ""

echo "🚨 Detecting iCloud-managed directories…"
for r in "${RESULTS[@]}"; do
    if mdls -name kMDItemIsUbiquitous "$r" 2>/dev/null | grep -q "1"; then
        echo "⚠️ iCloud folder detected (NOT SAFE for dev): $r"
    else
        echo "✅ Local folder (safe): $r"
    fi
done
echo ""

echo "🎯 Selecting the TRUE monorepo…"
echo ""

BEST="$HOME/Developer/$TARGET_NAME"

if [[ -d "$BEST" ]]; then
    echo "🏆 TRUE REPO IDENTIFIED:"
    echo "   $BEST"
    echo ""
    echo "💡 Use this path for:"
    echo "   • pnpm commands"
    echo "   • turbo pipeline"
    echo "   • Expo Orbit"
    echo "   • mobile + web builds"
else
    echo "⚠️ Expected repo path not found at: $BEST"
    echo "⚠️ Choose manually from VALID_REPOS above."
fi

echo ""
echo "🔥 DONE — Magnus Monorepo Locator & Validator completed."
echo "---------------------------------------------------------"
echo ""
