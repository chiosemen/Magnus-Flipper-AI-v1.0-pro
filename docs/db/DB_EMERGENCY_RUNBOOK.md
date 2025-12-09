# Magnus Flipper — DB Emergency Runbook

## 1. Golden Rules

1. Do **NOT** run manual SQL in production without a backup.

2. Always:

   - Take a backup

   - Check drift

   - Apply migration

   - Verify with smoke tests

---

## 2. Pre-Change Checklist (Any Schema Change)

1. Set env:

   - `export SUPABASE_DB_URL="postgres://..."`

2. Backup:

   - `./scripts/db-backup.sh pre-change`

3. Drift check:

   - `./scripts/db-drift-check.sh`

   - Review the SQL. If unexpected changes appear → STOP.

4. Apply migration (via Cursor DB Surgeon):

   - Approve only after reading the plan.

   - Type `APPLY MIGRATION` when prompted.

5. Regenerate Prisma client:

   - `pnpm --filter core prisma generate`

6. Regenerate ERD:

   - `pnpm --filter core db:erd`

---

## 3. Incident: Bad Migration Deployed

### Symptoms

- 500s from API or workers

- Admin panel fails on DB queries

- New fields missing / wrong type

### Response Steps

1. **Identify migration**

   - Check git diff in `supabase/migrations/`

   - Note the migration filename and contents.

2. **Decide strategy**

   - If purely additive (only new columns/tables) → consider hotfix forward migration.

   - If destructive (dropped/renamed columns) → consider rollback.

3. **Rollback (if safe)**

   - Find the latest backup:

     ```bash

     ls db_backups/

     ```

   - Restore (NON-PROD ONLY unless absolutely necessary):

     ```bash

     ./scripts/db-restore.sh db_backups/supabase_backup_YYYYMMDD_HHMMSS_pre-change.sql

     ```

4. **Forward Fix (preferred in production)**

   - Write a corrective migration:

     - Recreate dropped columns (nullable)

     - Backfill where possible

   - Apply via Cursor DB Surgeon.

5. **Verify**

   - Run smoke tests:

     - Key API routes

     - Worker scraper flows

     - Admin dashboard

---

## 4. Routine Maintenance

### Weekly

- `./scripts/db-drift-check.sh`

- `pnpm --filter core db:erd`

### Before any release

- Backup DB.

- Run drift check.

- Ensure migrations are committed and tagged.

---

## 5. Contacts / Ownership

- **DB Owner:** Magnus Flipper Core (you)

- **Primary Surrogate:** DB Architecture Refactoring Surgeon v2 (Cursor agent)

This runbook should be updated whenever:

- New critical tables are added

- Backup or restore processes change

- New environments (staging, QA) are added
