#!/usr/bin/env bash
# Dumps the postgres database to ./backups/ with a timestamped filename.
# Run from the project root: bash scripts/backup-db.sh
# Add to cron for automated daily backups, e.g.:
#   0 2 * * * cd /opt/thangatamil && bash scripts/backup-db.sh >> /var/log/thangatamil-backup.log 2>&1
set -euo pipefail

cd "$(dirname "$0")/.."
source .env

mkdir -p backups
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILE="backups/contact_db_${TIMESTAMP}.sql.gz"

docker compose exec -T db pg_dump -U postgres contact_db | gzip > "$FILE"

echo "Backup written to $FILE"

# Keep the last 14 backups only
ls -1t backups/*.sql.gz | tail -n +15 | xargs -r rm --
