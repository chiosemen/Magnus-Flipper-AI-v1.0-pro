#!/usr/bin/env bash
set -euo pipefail

ROOT="/Users/chinyeosemene/Developer/Magnus-Flipper-AI-v1.0-pro"
cd "$ROOT"

run_step() {
  local name="$1"; shift
  echo "🔧 Running ${name}..."
  if "$@"; then
    echo "✅ ${name} completed"
  else
    echo "❌ ${name} failed"
    return 1
  fi
}

STATUS=0

run_step "namespace-lint-v3" node scripts/namespace-lint-v3.js || STATUS=1
run_step "workspace-fixer" node scripts/workspace-fixer.js || STATUS=1
run_step "turbo-fortify-v3" node scripts/turbo-fortify-v3.js || STATUS=1

if [ $STATUS -ne 0 ]; then
  echo "⚠️  Supervisor completed with failures. Review logs above."
  exit 1
fi

echo "🎉 Namespace Supervisor v1 PASS"
