# Prune Report

## Context
- Original prune report was not present in the repo; this file rebuilds the record based on the executed prune.

## Hard Deletes
- Removed legacy apps and backups (deploy-guardian apps, canary ingestor, broken web backup, standalone version, dashboard, apify actor).
- Removed legacy packages not imported by the kept apps (core, compliance, marketplace, operator, SDK, deploy-guardian contracts/store, utils, schemas, types, ui-config, server-only).
- Removed deprecated tooling, archives, and root-level summaries that were outside the kept documentation surface.
- Removed non-migration database artifacts (edge functions, seeds, backup migrations, and auxiliary SQL scripts).

## Updated Structure
- Workspace trimmed to `apps/*` plus `packages/ui` only.
- Web tests and configs cleaned to drop deploy-guardian coverage and contracts aliasing.
- CI now targets lint, typecheck, build, and tests for the kept apps.

## How to Validate
- `pnpm install`
- `pnpm -w lint`
- `pnpm -r run typecheck --if-present`
- `pnpm -r run build --if-present`
- `pnpm --filter @magnus/web test`
- `pnpm --filter magnus-flipper-mobile test`
