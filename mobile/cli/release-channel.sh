#!/usr/bin/env bash
set -e

CHANNEL=$1

if [ -z "$CHANNEL" ]; then
  echo "Usage: release-channel.sh <channel>"
  exit 1
fi

npx expo publish --release-channel $CHANNEL
