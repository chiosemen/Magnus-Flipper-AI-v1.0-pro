#!/bin/bash
BROKEN_APPS=(
  "apps/canary-ingestor"
  "apps/canary-streamer"
  "apps/web_broken_backup"
)

for app in "${BROKEN_APPS[@]}"; do
  if [ -d "$app" ]; then
    echo "⚠️ Disabling $app"
    mv "$app/package.json" "$app/package.json.disabled" || true
  fi
done
