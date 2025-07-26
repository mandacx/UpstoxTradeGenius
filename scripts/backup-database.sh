#!/bin/bash

# Database Backup Script for Trading Dashboard
# This script creates comprehensive backups of schema and data

set -e

# Configuration
BACKUP_DIR="database/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
SCHEMA_BACKUP="${BACKUP_DIR}/schema_${TIMESTAMP}.sql"
DATA_BACKUP="${BACKUP_DIR}/data_${TIMESTAMP}.sql"
FULL_BACKUP="${BACKUP_DIR}/full_backup_${TIMESTAMP}.sql"

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

echo "🔄 Starting database backup at $(date)"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable is not set"
    exit 1
fi

# Extract connection details from DATABASE_URL
# Handle both postgres:// and postgresql:// schemes
DB_URL=$(echo $DATABASE_URL | sed 's/postgres:/postgresql:/')

echo "📊 Creating schema-only backup..."
pg_dump --schema-only --no-owner --no-privileges "$DB_URL" > "$SCHEMA_BACKUP"

echo "💾 Creating data-only backup..."
pg_dump --data-only --no-owner --no-privileges "$DB_URL" > "$DATA_BACKUP"

echo "🗄️ Creating full backup..."
pg_dump --no-owner --no-privileges "$DB_URL" > "$FULL_BACKUP"

# Compress backups to save space
echo "🗜️ Compressing backups..."
gzip "$SCHEMA_BACKUP" "$DATA_BACKUP" "$FULL_BACKUP"

# Clean up old backups (keep last 10)
echo "🧹 Cleaning up old backups..."
cd "${BACKUP_DIR}"
ls -t *.sql.gz | tail -n +31 | xargs -r rm

echo "✅ Database backup completed successfully!"
echo "📁 Backup files created:"
echo "   - Schema: ${SCHEMA_BACKUP}.gz"
echo "   - Data: ${DATA_BACKUP}.gz" 
echo "   - Full: ${FULL_BACKUP}.gz"

# Add to git if in a git repository
if [ -d "${BACKUP_DIR}" ] && cd "${BACKUP_DIR}" && git rev-parse --git-dir > /dev/null 2>&1; then
    echo "🔗 Adding backups to git repository..."
    git add *.sql.gz 2>/dev/null || echo "ℹ️ No backup files to add to git"
    git commit -m "Database backup: $(date '+%Y-%m-%d %H:%M:%S')" 2>/dev/null || echo "ℹ️ No changes to commit"
    cd - > /dev/null
fi

echo "🎉 Backup process completed at $(date)"