#!/usr/bin/env bash
set -euo pipefail

echo "🛑 Stopping test database containers..."

docker-compose -f docker-compose.test.yml down

echo "✅ Test database containers stopped"

