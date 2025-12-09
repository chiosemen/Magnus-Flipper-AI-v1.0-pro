#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   ./scripts/db-restore.sh path/to/backup.sql
#
# WARNING:
#   This will execute the SQL against SUPABASE_DB_URL.
#   Only use in non-production OR with explicit approval.

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 path/to/backup.sql"
  exit 1
fi

BACKUP_FILE="$1"

if [[ ! -f "$BACKUP_FILE" ]]; then
  echo "ERROR: Backup file not found: $BACKUP_FILE"
  exit 1
fi

if [[ -z "${SUPABASE_DB_URL:-}" ]]; then
  echo "ERROR: SUPABASE_DB_URL is not set."
  exit 1
fi

echo "⚠️  You are about to restore from: $BACKUP_FILE"
read -r -p "Type RESTORE NOW to continue: " CONFIRM

if [[ "$CONFIRM" != "RESTORE NOW" ]]; then
  echo "Restore cancelled."
  exit 1
fi

echo "♻️  Restoring..."
psql "$SUPABASE_DB_URL" < "$BACKUP_FILE"

echo "✅ Restore complete."
