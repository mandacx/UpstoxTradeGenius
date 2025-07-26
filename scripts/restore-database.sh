#!/bin/bash

# Database Restore Script for Trading Dashboard
# This script restores database from backup files

set -e

# Configuration
BACKUP_DIR="database/backups"

echo "🔄 Database Restore Script"
echo "========================="

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable is not set"
    exit 1
fi

# Extract connection details from DATABASE_URL
DB_URL=$(echo $DATABASE_URL | sed 's/postgres:/postgresql:/')

# Function to list available backups
list_backups() {
    echo "📋 Available backups:"
    echo "====================="
    
    if [ ! -d "$BACKUP_DIR" ]; then
        echo "❌ No backup directory found at $BACKUP_DIR"
        exit 1
    fi
    
    cd "$BACKUP_DIR"
    
    echo "Schema-only backups:"
    ls -la schema_*.sql.gz 2>/dev/null | head -10 || echo "  No schema backups found"
    
    echo ""
    echo "Data-only backups:"
    ls -la data_*.sql.gz 2>/dev/null | head -10 || echo "  No data backups found"
    
    echo ""
    echo "Full backups:"
    ls -la full_backup_*.sql.gz 2>/dev/null | head -10 || echo "  No full backups found"
}

# Function to restore from backup
restore_backup() {
    local backup_file="$1"
    local backup_type="$2"
    
    if [ ! -f "$BACKUP_DIR/$backup_file" ]; then
        echo "❌ Backup file not found: $BACKUP_DIR/$backup_file"
        exit 1
    fi
    
    echo "⚠️  WARNING: This will ${backup_type} restore your database!"
    echo "📁 Restoring from: $backup_file"
    read -p "Are you sure you want to continue? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Restore cancelled"
        exit 0
    fi
    
    echo "🔄 Starting restore process..."
    
    # Decompress and restore
    cd "$BACKUP_DIR"
    gunzip -c "$backup_file" | psql "$DB_URL"
    
    echo "✅ Database restored successfully!"
}

# Parse command line arguments
case "${1:-}" in
    "list"|"ls")
        list_backups
        ;;
    "restore-schema")
        if [ -z "$2" ]; then
            echo "❌ Please specify schema backup file"
            echo "Usage: $0 restore-schema <schema_backup_file.sql.gz>"
            list_backups
            exit 1
        fi
        restore_backup "$2" "schema-only"
        ;;
    "restore-data")
        if [ -z "$2" ]; then
            echo "❌ Please specify data backup file"
            echo "Usage: $0 restore-data <data_backup_file.sql.gz>"
            list_backups
            exit 1
        fi
        restore_backup "$2" "data-only"
        ;;
    "restore-full")
        if [ -z "$2" ]; then
            echo "❌ Please specify full backup file"
            echo "Usage: $0 restore-full <full_backup_file.sql.gz>"
            list_backups
            exit 1
        fi
        restore_backup "$2" "full"
        ;;
    "latest")
        echo "🔄 Restoring from latest full backup..."
        cd "$BACKUP_DIR"
        latest_backup=$(ls -t full_backup_*.sql.gz 2>/dev/null | head -1)
        if [ -z "$latest_backup" ]; then
            echo "❌ No full backups found"
            exit 1
        fi
        restore_backup "$latest_backup" "full"
        ;;
    *)
        echo "📖 Usage:"
        echo "  $0 list                           - List available backups"
        echo "  $0 restore-schema <file>          - Restore schema only"
        echo "  $0 restore-data <file>            - Restore data only"
        echo "  $0 restore-full <file>            - Full restore"
        echo "  $0 latest                         - Restore from latest full backup"
        echo ""
        list_backups
        ;;
esac