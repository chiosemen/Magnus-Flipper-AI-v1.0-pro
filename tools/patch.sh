#!/bin/bash

# Usage:
#   ./tools/patch.sh apps/mobile/app/home.tsx
#   ./tools/patch.sh apps/mobile/hooks/useListings.ts

FILE=$1

if [ -z "$FILE" ]; then
  echo "❌ No file specified."
  echo "Usage: ./tools/patch.sh <path-to-file>"
  exit 1
fi

echo "⚡ Opening Codex patch mode for: $FILE"
echo ""
echo "Type your instructions below. When done, press CTRL+D."
echo ""

codex -m gpt-5.1-codex-max apply <<EOF
@patch $FILE
# FIX / MODIFY / IMPROVE THIS FILE
# Your instructions go under here:

EOF
