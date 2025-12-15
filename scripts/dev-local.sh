#!/usr/bin/env bash
set -e

echo "🟢 Magnus Flipper — One-Click Local Dev"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

############################################
# 0. Load env (safe)
############################################
if [ -f .env.local ]; then
  echo "🔐 Loading .env.local"
  export $(grep -v '^#' .env.local | xargs)
fi

export NODE_ENV=development
export REDIS_HOST=${REDIS_HOST:-127.0.0.1}
export REDIS_PORT=${REDIS_PORT:-6379}

############################################
# 1. Redis (idempotent)
############################################
echo "🟥 Ensuring Redis is running..."

if docker ps --format '{{.Names}}' | grep -q '^magnus-redis$'; then
  echo "✅ Redis already running"
else
  if docker ps -a --format '{{.Names}}' | grep -q '^magnus-redis$'; then
    docker start magnus-redis
  else
    docker run -d \
      --name magnus-redis \
      -p 6379:6379 \
      redis:7-alpine
  fi
fi

sleep 1
docker exec magnus-redis redis-cli ping >/dev/null
echo "✅ Redis ready"

############################################
# 2. Build shared packages (cheap & safe)
############################################
echo "📦 Building shared packages..."

pnpm --filter @magnus-flipper-ai/queue build
pnpm --filter @magnus-flipper-ai/scrapers build

echo "✅ Shared packages built"

############################################
# 3. Start workers + web (parallel)
############################################
echo "🚀 Starting workers + web..."

tmux new-session -d -s magnus-dev

tmux rename-window -t magnus-dev:0 redis

tmux new-window -t magnus-dev -n scheduler \
  "pnpm --filter worker-scheduler dev"

tmux new-window -t magnus-dev -n ingest \
  "pnpm --filter worker-ingest dev"

tmux new-window -t magnus-dev -n web \
  "pnpm --filter web dev"

############################################
# 4. Attach
############################################
echo ""
echo "🎉 All services started"
echo "🧭 tmux session: magnus-dev"
echo ""
echo "Windows:"
echo "  • scheduler  → cron + enqueue"
echo "  • ingest     → scraping workers"
echo "  • web        → http://localhost:3000"
echo ""
echo "Detach with:  Ctrl+B then D"
echo "Stop all with: tmux kill-session -t magnus-dev"
echo ""

tmux attach -t magnus-dev

