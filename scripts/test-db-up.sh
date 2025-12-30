#!/usr/bin/env bash
set -euo pipefail

echo "🔄 Starting test database containers..."

docker-compose -f docker-compose.test.yml up -d

echo "⏳ Waiting for services to be healthy..."

# Wait for postgres
timeout=30
elapsed=0
until docker-compose -f docker-compose.test.yml exec -T postgres-test pg_isready -U postgres > /dev/null 2>&1; do
  if [ $elapsed -ge $timeout ]; then
    echo "❌ Postgres failed to start within ${timeout}s"
    exit 1
  fi
  sleep 1
  elapsed=$((elapsed + 1))
done

# Wait for redis
elapsed=0
until docker-compose -f docker-compose.test.yml exec -T redis-test redis-cli ping > /dev/null 2>&1; do
  if [ $elapsed -ge $timeout ]; then
    echo "❌ Redis failed to start within ${timeout}s"
    exit 1
  fi
  sleep 1
  elapsed=$((elapsed + 1))
done

echo "✅ Test database containers are ready"

