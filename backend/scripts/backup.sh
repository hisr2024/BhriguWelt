#!/bin/bash
# ===========================================
# BhriguWelt Automated Backup Script
# Backs up database, logs, and configuration
# ===========================================

set -euo pipefail

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/app/backups}"
DB_FILE="${DATABASE_URL:-sqlite:///./bhriguwelt.db}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="bhriguwelt_backup_${TIMESTAMP}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

log_info "Starting backup: ${BACKUP_NAME}"

# Create backup subdirectory
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_NAME}"
mkdir -p "${BACKUP_PATH}"

# Backup database
log_info "Backing up database..."
if [[ $DB_FILE == sqlite://* ]]; then
    # SQLite backup
    DB_PATH="${DB_FILE#sqlite:///}"
    if [[ -f "$DB_PATH" ]]; then
        cp "$DB_PATH" "${BACKUP_PATH}/database.db"
        log_info "Database backed up: $(du -h "${BACKUP_PATH}/database.db" | cut -f1)"
    else
        log_warn "Database file not found: $DB_PATH"
    fi
elif [[ $DB_FILE == postgresql://* ]]; then
    # PostgreSQL backup
    DB_NAME=$(echo "$DB_FILE" | sed -n 's/.*\/\([^?]*\).*/\1/p')
    pg_dump "$DB_FILE" > "${BACKUP_PATH}/database.sql"
    log_info "PostgreSQL database backed up: $(du -h "${BACKUP_PATH}/database.sql" | cut -f1)"
else
    log_warn "Unsupported database type, skipping database backup"
fi

# Backup logs
log_info "Backing up logs..."
LOGS_DIR="/app/backend/logs"
if [[ -d "$LOGS_DIR" ]]; then
    tar -czf "${BACKUP_PATH}/logs.tar.gz" -C "$(dirname "$LOGS_DIR")" "$(basename "$LOGS_DIR")" 2>/dev/null || log_warn "No logs to backup"
    if [[ -f "${BACKUP_PATH}/logs.tar.gz" ]]; then
        log_info "Logs backed up: $(du -h "${BACKUP_PATH}/logs.tar.gz" | cut -f1)"
    fi
fi

# Backup configuration (excluding secrets)
log_info "Backing up configuration..."
CONFIG_FILES=(
    "/app/backend/data/bhrigu_samhita_principles.yml"
    "/app/backend/data/nadi_jyotisha_principles.yml"
    "/app/core_wisdom/bhrigu_samhita_corpus.yml"
    "/app/core_wisdom/nadi_jyotisha_corpus.yml"
)

mkdir -p "${BACKUP_PATH}/config"
for file in "${CONFIG_FILES[@]}"; do
    if [[ -f "$file" ]]; then
        cp "$file" "${BACKUP_PATH}/config/" 2>/dev/null || true
    fi
done

# Create backup metadata
cat > "${BACKUP_PATH}/metadata.json" <<EOF
{
  "backup_name": "${BACKUP_NAME}",
  "timestamp": "$(date -Iseconds)",
  "hostname": "$(hostname)",
  "database_type": "$(echo "$DB_FILE" | cut -d: -f1)",
  "retention_days": ${RETENTION_DAYS}
}
EOF

log_info "Backup metadata created"

# Compress backup
log_info "Compressing backup..."
cd "${BACKUP_DIR}"
tar -czf "${BACKUP_NAME}.tar.gz" "${BACKUP_NAME}"
rm -rf "${BACKUP_NAME}"

BACKUP_SIZE=$(du -h "${BACKUP_NAME}.tar.gz" | cut -f1)
log_info "Backup compressed: ${BACKUP_SIZE}"

# Clean up old backups
log_info "Cleaning up old backups (retention: ${RETENTION_DAYS} days)..."
find "${BACKUP_DIR}" -name "bhriguwelt_backup_*.tar.gz" -type f -mtime +${RETENTION_DAYS} -delete
OLD_COUNT=$(find "${BACKUP_DIR}" -name "bhriguwelt_backup_*.tar.gz" -type f | wc -l)
log_info "Retained ${OLD_COUNT} backup(s)"

# Upload to S3 (optional)
if [[ -n "${AWS_S3_BUCKET:-}" ]]; then
    log_info "Uploading to S3: ${AWS_S3_BUCKET}"
    aws s3 cp "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz" "s3://${AWS_S3_BUCKET}/backups/${BACKUP_NAME}.tar.gz" || log_warn "S3 upload failed"
fi

# Upload to Google Cloud Storage (optional)
if [[ -n "${GCS_BUCKET:-}" ]]; then
    log_info "Uploading to GCS: ${GCS_BUCKET}"
    gsutil cp "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz" "gs://${GCS_BUCKET}/backups/${BACKUP_NAME}.tar.gz" || log_warn "GCS upload failed"
fi

# Send notification (optional)
if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"✅ BhriguWelt backup completed: ${BACKUP_NAME} (${BACKUP_SIZE})\"}" \
        "${SLACK_WEBHOOK_URL}" 2>/dev/null || true
fi

log_info "Backup completed successfully: ${BACKUP_NAME}.tar.gz"
echo ""
echo "Backup location: ${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"
echo "Backup size: ${BACKUP_SIZE}"
echo ""
