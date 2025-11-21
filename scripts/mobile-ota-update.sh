#!/usr/bin/env bash
set -euo pipefail

cd mobile

echo "📦 Publishing OTA update…"
npx expo update --branch production --message "OTA patch $(date '+%Y-%m-%d %H:%M')"

