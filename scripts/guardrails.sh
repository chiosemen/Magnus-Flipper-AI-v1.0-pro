#!/bin/bash

echo "== Magnus Repo Guardrail =="

if [[ -n $(git status --porcelain) ]]; then
  echo "❌ Repo is dirty — commit or stash changes FIRST."
  exit 1
fi

echo "✔ Repo is clean. Safe for Claude patches."

