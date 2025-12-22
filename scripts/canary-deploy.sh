#!/usr/bin/env bash
set -euo pipefail

echo "=============================================="
echo "🚀 CANARY DEPLOY SEQUENCE — WORKERS → WEB"
echo "=============================================="

# ---- CONFIG ----
WAIT_SECONDS=300   # 5 minutes
HEALTH_TIMEOUT=30

check_health () {
  local name=$1
  local url=$2

  echo "🔍 Checking health for $name..."
  if curl -fsS --max-time $HEALTH_TIMEOUT "$url" > /dev/null; then
    echo "✅ $name healthy"
  else
    echo "❌ $name health check failed"
    echo "🛑 STOPPING DEPLOY"
    exit 1
  fi
}

pause () {
  echo "⏳ Waiting ${WAIT_SECONDS}s for canary signals..."
  sleep $WAIT_SECONDS
}

# ==========================================================
# 0️⃣ PRE-FLIGHT
# ==========================================================
./scripts/deploy-green-light.sh

# ==========================================================
# 1️⃣ WORKER AUTOS (LOW RISK)
# ==========================================================
echo "▶ Deploying worker-autosell"
# az functionapp deployment source config-zip ...
pause

# ==========================================================
# 2️⃣ WORKER TRACKER
# ==========================================================
echo "▶ Deploying worker-tracker"
pause

# ==========================================================
# 3️⃣ WORKER ALERTS
# ==========================================================
echo "▶ Deploying worker-alerts"
pause

# ==========================================================
# 4️⃣ WORKER SCRAPER
# ==========================================================
echo "▶ Deploying worker-scraper"
pause

# ==========================================================
# 5️⃣ WORKER REALTIME
# ==========================================================
echo "▶ Deploying worker-realtime"
pause

# ==========================================================
# 6️⃣ WORKER SCHEDULER (HIGH RISK)
# ==========================================================
echo "▶ Deploying worker-scheduler"
pause

# ==========================================================
# 7️⃣ WEB (HIGHEST RISK)
# ==========================================================
echo "▶ Deploying web (Vercel)"
vercel deploy --prod
check_health "Web" "https://your-domain.com/api/health"

echo "=============================================="
echo "🟢 CANARY DEPLOY COMPLETE"
echo "=============================================="


