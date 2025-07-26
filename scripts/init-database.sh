#!/bin/bash

# Database Initialization Script for Trading Dashboard
# This script initializes the database with schema and sample data

set -e

echo "🚀 Database Initialization Script"
echo "================================="

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable is not set"
    exit 1
fi

# Extract connection details from DATABASE_URL
DB_URL=$(echo $DATABASE_URL | sed 's/postgres:/postgresql:/')

echo "🔍 Checking database connection..."
if ! psql "$DB_URL" -c "SELECT 1;" >/dev/null 2>&1; then
    echo "❌ Cannot connect to database. Please check your DATABASE_URL"
    exit 1
fi

echo "✅ Database connection successful"

# Push schema using Drizzle
echo "📊 Pushing database schema using Drizzle..."
npm run db:push

echo "🌱 Database schema initialized successfully!"

# Optional: Load sample data if it exists
SAMPLE_DATA_FILE="database/sample-data.sql"
if [ -f "$SAMPLE_DATA_FILE" ]; then
    echo "📝 Loading sample data..."
    psql "$DB_URL" < "$SAMPLE_DATA_FILE"
    echo "✅ Sample data loaded successfully!"
else
    echo "ℹ️  No sample data file found at $SAMPLE_DATA_FILE"
fi

echo "🎉 Database initialization completed!"