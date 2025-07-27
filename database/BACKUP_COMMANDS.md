# Database Backup Commands Reference

## Quick Commands

### Create Complete Backup (SQL + JSON)
```bash
./scripts/backup-database.sh
```
This creates:
- Schema-only backup (.sql.gz)
- Data-only backup (.sql.gz) 
- Full backup (.sql.gz)
- JSON export (.json.gz)

### JSON-Only Export
```bash
./scripts/export-data-json.sh
```

### List Available Backups
```bash
./scripts/restore-database.sh list
```

### Restore from Latest Backup
```bash
./scripts/restore-database.sh latest
```

## File Locations

- **SQL Backups:** `database/backups/`
- **JSON Exports:** `database/exports/`
- **Schema Export:** `database/schema-export.sql`
- **Sample Data:** `database/sample-data.sql`

## Git Repositories

- **Schema & Documentation:** `database/.git/`
- **SQL Backups:** `database/backups/.git/`
- **JSON Exports:** `database/exports/.git/`

## Backup Features

✅ Automated compression with gzip
✅ Retention policy (keeps last 30 backups)
✅ Git version control integration
✅ Timestamp-based naming
✅ Multiple backup formats
✅ Error handling and validation
✅ Comprehensive data export

## Automated Cleanup

- SQL backups: Keeps last 30 files
- JSON exports: Keeps last 20 files
- Git commits track all changes
- Compressed storage saves disk space