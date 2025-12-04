cat > ~/free_space_safe.sh << 'EOF'
#!/usr/bin/env bash
set -euo pipefail

echo "=== macOS Dev Cleanup (Safe Mode) ==="

echo ""
echo "1) Cleaning Xcode DerivedData…"
if [ -d "$HOME/Library/Developer/Xcode/DerivedData" ]; then
  echo "   Before:"
  du -sh "$HOME/Library/Developer/Xcode/DerivedData" || true
  rm -rf "$HOME/Library/Developer/Xcode/DerivedData"/*
  echo "   After:"
  du -sh "$HOME/Library/Developer/Xcode/DerivedData" || true
else
  echo "   No DerivedData folder found."
fi

echo ""
echo "2) Cleaning CoreSimulator caches…"
if [ -d "$HOME/Library/Developer/CoreSimulator/Caches" ]; then
  echo "   Before:"
  du -sh "$HOME/Library/Developer/CoreSimulator/Caches" || true
  rm -rf "$HOME/Library/Developer/CoreSimulator/Caches"/*
  echo "   After:"
  du -sh "$HOME/Library/Developer/CoreSimulator/Caches" || true
else
  echo "   No CoreSimulator cache folder found."
fi

echo ""
echo "3) Cleaning Node/JS package manager caches…"
pnpm store prune || true
npm cache clean --force || true
yarn cache clean || true

echo ""
echo "4) Cleaning Expo cache…"
rm -rf "$HOME/.expo/cache" "$HOME/.expo/ios-simulator-app-cache" 2>/dev/null || true

echo ""
echo "5) Cleaning Watchman state (if installed)…"
if command -v watchman >/dev/null 2>&1; then
  watchman watch-del-all || true
fi

echo ""
echo "6) Optional: Docker system prune"
if command -v docker >/dev/null 2>&1; then
  docker system df || true
  read -r -p "   → Prune Docker images/containers/volumes? (y/N) " ans
  if [ "${ans:-N}" = "y" ] || [ "${ans:-N}" = "Y" ]; then
    docker system prune -af --volumes || true
  else
    echo "   Skipping Docker prune."
  fi
else
  echo "   Docker CLI not found, skipping Docker prune."
fi

echo ""
echo "7) Cleaning Homebrew caches…"
if command -v brew >/dev/null 2>&1; then
  brew cleanup -s || true
  rm -rf "$HOME/Library/Caches/Homebrew" 2>/dev/null || true
fi

echo ""
echo "=== Done. Current disk usage on / ==="
df -h /
EOF

