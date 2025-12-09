# Staging DB Playbook — Magnus Flipper

## What is STAGING?

A separate Supabase project that mirrors production schema but is used only for:

- Testing migrations

- Verifying DB changes

- Running DB experiments safely

If STAGING breaks, PRODUCTION is untouched.

---

## Secrets

In GitHub → Settings → Secrets and variables → Actions:

- `SUPABASE_DB_URL` → Production DB

- `SUPABASE_STAGING_DB_URL` → Staging DB

---

## Local Usage

### Apply migrations to STAGING

```bash
export SUPABASE_STAGING_DB_URL="postgres://..."
./scripts/db-migrate-staging.sh
```

### Apply migrations to PRODUCTION (be careful)

```bash
export SUPABASE_DB_URL="postgres://..."
./scripts/db-migrate-prod.sh
```

---

## GitHub Actions

### 1. PR Safety

- `.github/workflows/db-safety.yml`

- Runs drift check

- Generates ERD

- Blocks destructive SQL

### 2. Main-branch Migration

- `.github/workflows/db-migrate.yml`

- On main push:

  1. Applies migrations to STAGING

  2. If success → applies migrations to PRODUCTION

  3. Runs drift + regenerates ERD

  4. Uploads artifacts

---

## Cursor DB Surgeon v3

Cursor tools:

- `db_drift` → Drift check

- `db_backup` → Backups

- `db_restore` → Emergency restore

- `supabase_migrate` → Generic migrations (prod, via SUPABASE_DB_URL)

- `supabase_migrate_staging` → STAGING-only migrations

- `supabase_migrate_prod` → PRODUCTION-only migrations (use with extreme care)

Protocol:

1. Run drift check

2. Plan migration

3. Apply to STAGING first

4. Verify

5. Apply to PRODUCTION only with explicit approval

6. Regenerate ERD

---

## Workflow Summary

```
┌─────────────────────────────────────────┐
│  PR Created (DB Changes)                │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  db-safety.yml (PR Safety Checks)       │
│  - Drift check                           │
│  - ERD generation                        │
│  - Destructive SQL blocking              │
│  - PR comments                           │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  PR Merged to main                       │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  db-migrate.yml (Apply Migrations)      │
│  1. Drift check (before)                 │
│  2. Apply to STAGING                    │
│  3. Apply to PRODUCTION (if staging OK) │
│  4. Drift check (after)                  │
│  5. Generate ERD                         │
│  6. Upload artifacts                     │
└─────────────────────────────────────────┘
```

---

## Safety Guarantees

✅ **STAGING first** — Production never touched if staging fails

✅ **Drift checks** — Before and after migrations

✅ **ERD generation** — Visual schema verification

✅ **Artifact uploads** — Full audit trail

✅ **Explicit approval** — Production migrations require reason

---

## Emergency Procedures

If staging migration fails:

1. Check drift output in workflow artifacts

2. Review migration SQL

3. Fix migration file

4. Re-run workflow

If production migration fails:

1. Check drift_before.sql artifact

2. Restore from backup if needed: `./scripts/db-restore.sh`

3. Fix migration

4. Re-run workflow

See `DB_EMERGENCY_RUNBOOK.md` for detailed recovery procedures.
