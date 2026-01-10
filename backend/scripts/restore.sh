#!/bin/bash
# ===========================================
# BhriguWelt Restore Script
# Restores database, logs, and configuration from backup
# ===========================================

set -euo pipefail

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

# Check arguments
if [[ $# -lt 1 ]]; then
    log_error "Usage: $0 <backup_file.tar.gz> [--force]"
    echo ""
    echo "Available backups:"
    ls -lh /app/backups/*.tar.gz 2>/dev/null || echo "No backups found"
    exit 1
fi

BACKUP_FILE="$1"
FORCE="${2:-}"

if [[ ! -f "$BACKUP_FILE" ]]; then
    log_error "Backup file not found: $BACKUP_FILE"
    exit 1
fi

# Extract backup name
BACKUP_NAME=$(basename "$BACKUP_FILE" .tar.gz)
RESTORE_DIR="/tmp/restore_${BACKUP_NAME}"

log_info "Preparing to restore from: $BACKUP_FILE"

# Safety check
if [[ "$FORCE" != "--force" ]]; then
    log_warn "This will overwrite existing data!"
    read -p "Are you sure you want to continue? (yes/no): " confirm
    if [[ "$confirm" != "yes" ]]; then
        log_info "Restore cancelled"
        exit 0
    fi
fi

# Extract backup
log_info "Extracting backup..."
mkdir -p "$RESTORE_DIR"
tar -xzf "$BACKUP_FILE" -C "$RESTORE_DIR"

# Find the extracted directory
EXTRACTED_DIR=$(find "$RESTORE_DIR" -mindepth 1 -maxdepth 1 -type d | head -n1)

if [[ ! -d "$EXTRACTED_DIR" ]]; then
    log_error "Failed to extract backup"
    exit 1
fi

log_info "Backup extracted to: $EXTRACTED_DIR"

# Read metadata
if [[ -f "$EXTRACTED_DIR/metadata.json" ]]; then
    log_info "Backup metadata:"
    cat "$EXTRACTED_DIR/metadata.json" | python3 -m json.tool 2>/dev/null || cat "$EXTRACTED_DIR/metadata.json"
    echo ""
fi

# Stop application (if running)
log_warn "Stopping application..."
pkill -f "python.*app.py" 2>/dev/null || true
pkill -f "gunicorn" 2>/dev/null || true
sleep 2

# Restore database
log_info "Restoring database..."
DB_FILE="${DATABASE_URL:-sqlite:///./bhriguwelt.db}"

if [[ -f "$EXTRACTED_DIR/database.db" ]]; then
    # SQLite restore
    DB_PATH="${DB_FILE#sqlite:///}"
    if [[ -f "$DB_PATH" ]]; then
        cp "$DB_PATH" "${DB_PATH}.backup_$(date +%Y%m%d_%H%M%S)"
        log_info "Existing database backed up"
    fi
    cp "$EXTRACTED_DIR/database.db" "$DB_PATH"
    log_info "SQLite database restored"
elif [[ -f "$EXTRACTED_DIR/database.sql" ]]; then
    # PostgreSQL restore
    log_warn "Dropping existing PostgreSQL database..."
    psql "$DB_FILE" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
    psql "$DB_FILE" < "$EXTRACTED_DIR/database.sql"
    log_info "PostgreSQL database restored"
else
    log_warn "No database file found in backup"
fi

# Restore logs (optional)
if [[ -f "$EXTRACTED_DIR/logs.tar.gz" ]]; then
    log_info "Restoring logs..."
    LOGS_DIR="/app/backend/logs"
    mkdir -p "$LOGS_DIR"
    tar -xzf "$EXTRACTED_DIR/logs.tar.gz" -C "$(dirname "$LOGS_DIR")" || log_warn "Failed to restore logs"
    log_info "Logs restored"
fi

# Restore configuration
if [[ -d "$EXTRACTED_DIR/config" ]]; then
    log_info "Restoring configuration files..."
    cp -r "$EXTRACTED_DIR/config/"* /app/backend/data/ 2>/dev/null || true
    cp -r "$EXTRACTED_DIR/config/"* /app/core_wisdom/ 2>/dev/null || true
    log_info "Configuration files restored"
fi

# Clean up
log_info "Cleaning up temporary files..."
rm -rf "$RESTORE_DIR"

log_info "Restore completed successfully!"
echo ""
echo "⚠️  Please restart the application to apply changes:"
echo "    docker-compose restart backend"
echo "    # or"
echo "    systemctl restart bhriguwelt"
echo ""
