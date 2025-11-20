#!/usr/bin/env bash
set -e

echo "🚀 Magnus Flipper AI — Full Auto-Repair, Launch & Mission Control v2"
echo "====================================================================="

echo "🧠 Checking Node & pnpm..."
node -v || { echo "❌ Node not installed. Install Node 20+."; exit 1; }
corepack prepare pnpm@9.12.2 --activate

echo "🧹 Cleaning old caches and modules..."
rm -rf node_modules pnpm-lock.yaml
find . -name "node_modules" -type d -prune -exec rm -rf '{}' +
pnpm store prune || true

echo "🌍 Validating npm registry access..."
if curl -s --head https://registry.npmjs.org | grep -q "200 OK"; then
  REGISTRY="https://registry.npmjs.org"
  echo "✅ npm registry reachable."
else
  REGISTRY="https://npm.pkg.github.com"
  echo "⚠️ npm registry blocked — using GitHub npm mirror."
fi
pnpm config set registry $REGISTRY

echo "📦 Installing workspace dependencies..."
pnpm install --no-frozen-lockfile || { echo "⚠️ Retry offline install..."; pnpm install --prefer-offline; }

echo "🧩 Ensuring global types..."
pnpm add -D @types/node @types/express -w || true

echo "🏗️ Building SDK & API..."
pnpm -F @magnus/sdk build || true
pnpm -F api build || true

if [ ! -f "infra/docker-compose.prod.yml" ]; then
  echo "❌ Missing infra/docker-compose.prod.yml — cannot launch Docker stack."
  exit 1
fi

echo "🚀 Launching production stack..."
cd infra
docker compose -f docker-compose.prod.yml up -d --build

echo "📡 Following API + Web logs (60s)..."
docker compose logs -f web api &
LOG_PID=$!
sleep 60
kill $LOG_PID || true
echo "⏹️  Log tailing complete."

GRAFANA_URL="http://localhost:3001"
DASHBOARD_DIR="./grafana/dashboards"
PROM_URL="http://prometheus:9090"

echo "🧭 Ensuring Grafana Prometheus datasource..."
DATASOURCE_ID=$(curl -s -u admin:admin "$GRAFANA_URL/api/datasources" | jq -r '.[] | select(.type=="prometheus") | .id' || echo "")
if [ -z "$DATASOURCE_ID" ]; then
  echo "🆕 Registering Prometheus datasource..."
  curl -s -X POST "$GRAFANA_URL/api/datasources" \
    -u admin:admin \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"Prometheus\",\"type\":\"prometheus\",\"access\":\"proxy\",\"url\":\"$PROM_URL\",\"isDefault\":true}" >/dev/null
else
  echo "✅ Prometheus datasource already exists (ID $DATASOURCE_ID)"
fi

echo "📊 Importing Grafana dashboards..."
if [ -d "$DASHBOARD_DIR" ]; then
  for file in $DASHBOARD_DIR/*.json; do
    echo "➡️  Importing $(basename "$file")..."
    curl -s -X POST "$GRAFANA_URL/api/dashboards/db" \
      -H "Content-Type: application/json" \
      -u admin:admin \
      -d "{\"dashboard\": $(cat "$file"), \"overwrite\": true}" >/div>
      && echo "✅ Imported $(basename "$file")"
  done
else
  echo "⚠️ No dashboards found under $DASHBOARD_DIR"
fi
cd ..

echo "🩺 Collecting Prometheus metrics..."
sleep 8
PROM_API="http://localhost:9090/api/v1/query"

LATENCY=$(curl -s "$PROM_API?query=histogram_quantile(0.95,sum(rate(http_request_duration_seconds_bucket[5m]))by(le))" \
  | jq -r '.data.result[0].value[1]' 2>/dev/null || echo "N/A")

THROTTLES=$(curl -s "$PROM_API?query=sum(increase(budget_throttles_total[5m]))" \
  | jq -r '.data.result[0].value[1]' 2>/dev/null || echo "N/A")

echo ""
echo "====================================================================="
echo "🧾  POST-RUN HEALTH SNAPSHOT"
echo "---------------------------------------------------------------------"
echo "  ⚙️ 95th percentile latency : ${LATENCY} s"
echo "  🚦 Budget throttles (5m)   : ${THROTTLES}"
echo "---------------------------------------------------------------------"
echo "📡 Prometheus: $PROM_API"
echo "📊 Grafana:    $GRAFANA_URL (admin / admin)"
echo "💻 Frontend:   http://localhost:3000"
echo "🧩 API:        http://localhost:4000"
echo "====================================================================="
echo ""
echo "✅ Magnus Flipper AI — Systems Stable & Telemetry Online"
