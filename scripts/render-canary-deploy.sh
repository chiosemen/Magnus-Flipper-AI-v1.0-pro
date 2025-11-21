#!/usr/bin/env bash
set -euo pipefail

# Canary rollout
echo "🚦 Starting CANARY deploy (10% rollout)…"

# steps:
# 1. trigger deploy
# 2. wait to warm
# 3. hit /health 5 times
# 4. if all pass → promote to full

