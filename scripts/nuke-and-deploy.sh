#!/usr/bin/env bash
set -e

./scripts/lock-branches.sh
./scripts/quarantine-tech-trade-core.sh
./scripts/purge-everything.sh
./scripts/deploy-vercel-clean.sh

