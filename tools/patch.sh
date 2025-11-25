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
echo "Type your @patch instructions below. When done, press CTRL+D."
echo ""

INSTRUCTIONS=$(cat)

if [ -z "$INSTRUCTIONS" ]; then
  echo "❌ No instructions provided. Aborting."
  exit 1
fi

PROMPT=$(cat <<EOF
@patch $FILE
# FIX / MODIFY / IMPROVE THIS FILE
$INSTRUCTIONS
EOF
)

codex exec --sandbox workspace-write -m gpt-5.1-codex-max "$PROMPT"
