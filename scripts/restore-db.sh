#!/usr/bin/env bash
# Restores a backup produced by backup-db.sh
# Usage: bash scripts/restore-db.sh backups/contact_db_20260825_020000.sql.gz
set -euo pipefail

cd "$(dirname "$0")/.."
source .env

if [ -z "${1:-}" ]; then
  echo "Usage: $0 <path-to-backup.sql.gz>"
  exit 1
fi

echo "This will REPLACE all data in contact_db. Ctrl+C to cancel, Enter to continue."
read -r

gunzip -c "$1" | docker compose exec -T db psql -U postgres -d contact_db

echo "Restore complete."
