#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   ./scripts/db-backup.sh                # timestamped backup
#   ./scripts/db-backup.sh custom-label   # custom filename label
#
# Requires:
#   - SUPABASE_DB_URL (service-role connection string)
#   - pg_dump installed

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="$ROOT_DIR/db_backups"

mkdir -p "$BACKUP_DIR"

if [[ -z "${SUPABASE_DB_URL:-}" ]]; then
  echo "ERROR: SUPABASE_DB_URL is not set."
  echo "Use Supabase → Settings → Database → Connection String (service role)."
  exit 1
fi

LABEL="${1:-manual}"
TS="$(date -u +"%Y%m%d_%H%M%S")"
FILE="$BACKUP_DIR/supabase_backup_${TS}_${LABEL}.sql"

echo "📦 Creating backup at: $FILE"

PGPASSWORD="" pg_dump \
  --dbname="$SUPABASE_DB_URL" \
  --format=plain \
  --no-owner \
  --no-privileges \
  --schema=public \
  > "$FILE"

echo "✅ Backup complete."
