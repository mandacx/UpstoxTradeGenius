# Trading Dashboard Database

This directory contains database schema, sample data, and backup management for the Trading Dashboard application.

## Files

- `schema-export.sql` - Complete database schema with all tables, indexes, and constraints
- `sample-data.sql` - Sample data for development and testing
- `backups/` - Directory for automated database backups

## Backup System

The backup system provides comprehensive database backup and restore capabilities:

### Backup Scripts

- `../scripts/backup-database.sh` - Creates compressed backups (schema, data, and full)
- `../scripts/restore-database.sh` - Restores from backup files
- `../scripts/init-database.sh` - Initializes fresh database with schema

### Usage Examples

```bash
# Create a full backup
./scripts/backup-database.sh

# List available backups
./scripts/restore-database.sh list

# Restore from latest backup
./scripts/restore-database.sh latest

# Restore specific backup
./scripts/restore-database.sh restore-full full_backup_20250126_185304.sql.gz

# Initialize fresh database
./scripts/init-database.sh
```

### Backup Types

1. **Schema-only** (`schema_*.sql.gz`) - Database structure without data
2. **Data-only** (`data_*.sql.gz`) - Data without structure  
3. **Full backup** (`full_backup_*.sql.gz`) - Complete database with structure and data

### Automated Features

- Automatic compression using gzip
- Retention policy (keeps last 30 backups)
- Git integration for version control
- Timestamp-based naming
- Environment variable validation

## Database Schema Overview

### Core Tables

- `users` - User authentication and profiles
- `accounts` - User financial data and Upstox integration
- `strategies` - User-created trading strategies
- `backtests` - Strategy performance testing
- `eod_price_report` - End-of-day price data with OHLC

### Subscription Management

- `subscription_plans` - Available subscription tiers
- `user_subscriptions` - User subscription status
- `payment_methods` - Stored payment methods
- `payment_transactions` - Payment history

### Learning & Gamification

- `learning_paths` - Educational content paths
- `lessons` - Individual learning modules
- `user_progress` - Learning completion tracking
- `achievements` - Gamification rewards
- `user_stats` - User performance metrics

### System Tables

- `sessions` - Authentication session storage
- `configurations` - Application settings
- `logs` - System event logging
- `usage_analytics` - Feature usage tracking

## Environment Variables

Required environment variables:
- `DATABASE_URL` - PostgreSQL connection string

## Git Repository

This database directory is version controlled to track:
- Schema changes over time
- Backup file history
- Sample data updates
- Migration scripts

Initialize git tracking:
```bash
cd database
git add .
git commit -m "Initial database schema and setup"
```

## Development Workflow

1. Make schema changes in `shared/schema.ts`
2. Run `npm run db:push` to apply changes
3. Export updated schema: `./scripts/backup-database.sh`
4. Commit changes to git
5. Update sample data if needed

## Production Considerations

- Change default admin password
- Update sample data paths
- Configure automated backup scheduling
- Set up monitoring for backup failures
- Implement backup verification procedures