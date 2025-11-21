#!/usr/bin/env bash
set -e

echo "🔍 Validating render.yaml..."
render blueprint validate render.yaml

echo "🔧 Syncing services..."
render blueprint sync --file render.yaml --yes

echo "🚀 Deploying all Render services..."
for id in $(render services list --json | jq -r '.[].id'); do
  echo "Triggering deploy for: $id"
  render deploy create $id --wait
done
