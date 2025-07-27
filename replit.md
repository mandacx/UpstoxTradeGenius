# Trading Dashboard - Project Documentation

## Overview
A comprehensive trading dashboard platform that empowers users with advanced financial strategy development and intelligent market insights. The platform features sophisticated data analysis, user-centric trading experience, and complete subscription management.

**Current State:** Fully functional trading platform with advanced EOD reporting, authentication system, and comprehensive database backup infrastructure.

## Architecture
- **Frontend:** React with TypeScript, Vite build system
- **Backend:** Express.js with role-based access control  
- **Database:** PostgreSQL with Drizzle ORM
- **Authentication:** Passport.js with session management
- **External APIs:** Upstox API integration for trading data
- **Payments:** Stripe integration for subscriptions
- **Analytics:** Usage tracking and performance metrics

## Recent Changes

### Database Backup Infrastructure (2025-01-27)
- ✅ Created comprehensive backup system with automated scripts
- ✅ Added database schema export with all tables and relationships
- ✅ Implemented Git version control for database backups
- ✅ Created sample data for development and testing
- ✅ Added compression, retention policies, and automated cleanup
- ✅ Added JSON export functionality with structured data format
- ✅ Integrated unified backup system (SQL + JSON) with Git version control
- ✅ Created multiple Git repositories for organized backup management

### EOD Reports Enhancement (Previous)
- ✅ Added OHLC (Open, High, Low, Close) columns with color-coded headers
- ✅ Fixed expiry date filtering functionality
- ✅ Enhanced CSV export with all data fields
- ✅ Added sorting capabilities for all columns
- ✅ Fixed database schema issues with combDiff column

## Key Features

### Core Trading Features
- **Strategy Management:** User-created trading strategies with backtesting
- **Position Tracking:** Real-time position monitoring and P&L tracking
- **Risk Management:** Advanced risk controls and position sizing
- **EOD Reports:** Comprehensive end-of-day price analysis with OHLC data

### User Management
- **Authentication:** Secure login with session management
- **Role-based Access:** Admin, user, and premium user roles
- **Subscription Management:** Multiple tier subscriptions with Stripe
- **Payment Processing:** Secure payment handling with transaction history

### Learning & Gamification
- **Learning Paths:** Structured educational content
- **Achievements:** Gamified reward system
- **Progress Tracking:** User progress and statistics
- **Exclusive Content:** Premium strategies and advanced features

### Database Backup System
- **Automated Backups:** Schema, data, and full database backups
- **Git Integration:** Version control for backup files
- **Retention Policy:** Automatic cleanup of old backups
- **Restore Functionality:** Easy database restoration from backups

## Database Backup Commands

### Available Scripts
```bash
# Create full database backup
./scripts/backup-database.sh

# List available backups
./scripts/restore-database.sh list

# Restore from latest backup
./scripts/restore-database.sh latest

# Restore specific backup
./scripts/restore-database.sh restore-full <backup_file>

# Initialize fresh database
./scripts/init-database.sh
```

### Backup Types
1. **Schema-only:** Database structure without data
2. **Data-only:** Data without structure  
3. **Full backup:** Complete database with structure and data

## Important Files

### Database & Schema
- `shared/schema.ts` - Main database schema definitions
- `server/db.ts` - Database connection and configuration
- `server/storage.ts` - Data access layer implementation
- `database/schema-export.sql` - Complete database schema export
- `database/sample-data.sql` - Sample data for development

### Backup Infrastructure
- `scripts/backup-database.sh` - Unified backup script (SQL + JSON)
- `scripts/export-data-json.sh` - Standalone JSON export script
- `scripts/restore-database.sh` - Database restore functionality
- `scripts/init-database.sh` - Database initialization
- `database/backups/` - SQL backup storage (Git versioned)
- `database/exports/` - JSON export storage (Git versioned)
- `database/BACKUP_COMMANDS.md` - Quick reference guide

### Core Application
- `server/routes.ts` - API endpoints and route handlers
- `client/src/pages/eod-reports.tsx` - EOD reports interface
- `server/upstox.ts` - Upstox API integration
- `server/openai.ts` - AI integration for analysis

## Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Session encryption key
- `UPSTOX_*` - Upstox API credentials
- `STRIPE_*` - Stripe payment processing keys
- `OPENAI_API_KEY` - OpenAI API integration

## Development Workflow

### Database Changes
1. Update schema in `shared/schema.ts`
2. Run `npm run db:push` to apply changes
3. Create backup: `./scripts/backup-database.sh`
4. Commit changes to git
5. Update sample data if needed

### Backup Management
- Backups are automatically created with timestamps
- Git tracks all backup files for version control
- Retention policy keeps last 30 backups
- All backup types (schema, data, full) are generated

## User Preferences
- **Code Style:** TypeScript with strict typing
- **Database:** PostgreSQL with comprehensive backup system
- **Architecture:** Full-stack with clear separation of concerns
- **Documentation:** Detailed technical documentation preferred

## Current Development Focus
- Database backup and version control system
- EOD reports with enhanced OHLC data display
- Advanced filtering and export capabilities
- Comprehensive data integrity and backup procedures