#!/bin/bash

# JSON Data Export Script for Trading Dashboard
# Exports all database data to JSON format for version control

set -e

# Configuration
EXPORT_DIR="database/exports"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
JSON_EXPORT="${EXPORT_DIR}/database_export_${TIMESTAMP}.json"
LATEST_EXPORT="${EXPORT_DIR}/latest_export.json"

# Create export directory if it doesn't exist
mkdir -p "${EXPORT_DIR}"

echo "🔄 Starting JSON data export at $(date)"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable is not set"
    exit 1
fi

# Extract connection details from DATABASE_URL
DB_URL=$(echo $DATABASE_URL | sed 's/postgres:/postgresql:/')

echo "📊 Exporting database data to JSON..."

# Create comprehensive JSON export with all tables
psql "$DB_URL" -c "
COPY (
    SELECT json_build_object(
        'metadata', json_build_object(
            'export_timestamp', NOW(),
            'database_name', current_database(),
            'postgresql_version', version(),
            'total_tables', (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public')
        ),
        'users', COALESCE((SELECT json_agg(row_to_json(t)) FROM (SELECT * FROM users ORDER BY id) t), '[]'::json),
        'accounts', COALESCE((SELECT json_agg(row_to_json(t)) FROM (SELECT * FROM accounts ORDER BY id) t), '[]'::json),
        'configurations', COALESCE((SELECT json_agg(row_to_json(t)) FROM (SELECT * FROM configurations ORDER BY id) t), '[]'::json),
        'strategies', COALESCE((SELECT json_agg(row_to_json(t)) FROM (SELECT * FROM strategies ORDER BY id) t), '[]'::json),
        'exclusive_strategies', COALESCE((SELECT json_agg(row_to_json(t)) FROM (SELECT * FROM exclusive_strategies ORDER BY id) t), '[]'::json),
        'positions', COALESCE((SELECT json_agg(row_to_json(t)) FROM (SELECT * FROM positions ORDER BY id) t), '[]'::json),
        'backtests', COALESCE((SELECT json_agg(row_to_json(t)) FROM (SELECT * FROM backtests ORDER BY id) t), '[]'::json),
        'backtest_trades', COALESCE((SELECT json_agg(row_to_json(t)) FROM (SELECT * FROM backtest_trades ORDER BY id) t), '[]'::json),
        'modules', COALESCE((SELECT json_agg(row_to_json(t)) FROM (SELECT * FROM modules ORDER BY id) t), '[]'::json),
        'logs', COALESCE((SELECT json_agg(row_to_json(t)) FROM (SELECT * FROM logs ORDER BY id DESC LIMIT 1000) t), '[]'::json),
        'subscription_plans', COALESCE((SELECT json_agg(row_to_json(t)) FROM (SELECT * FROM subscription_plans ORDER BY id) t), '[]'::json),
        'user_subscriptions', COALESCE((SELECT json_agg(row_to_json(t)) FROM (SELECT * FROM user_subscriptions ORDER BY id) t), '[]'::json),
        'payment_methods', COALESCE((SELECT json_agg(row_to_json(t)) FROM (SELECT * FROM payment_methods ORDER BY id) t), '[]'::json),
        'payment_transactions', COALESCE((SELECT json_agg(row_to_json(t)) FROM (SELECT * FROM payment_transactions ORDER BY id) t), '[]'::json),
        'usage_analytics', COALESCE((SELECT json_agg(row_to_json(t)) FROM (SELECT * FROM usage_analytics ORDER BY id DESC LIMIT 10000) t), '[]'::json),
        'learning_paths', COALESCE((SELECT json_agg(row_to_json(t)) FROM (SELECT * FROM learning_paths ORDER BY id) t), '[]'::json),
        'lessons', COALESCE((SELECT json_agg(row_to_json(t)) FROM (SELECT * FROM lessons ORDER BY id) t), '[]'::json),
        'quizzes', COALESCE((SELECT json_agg(row_to_json(t)) FROM (SELECT * FROM quizzes ORDER BY id) t), '[]'::json),
        'user_progress', COALESCE((SELECT json_agg(row_to_json(t)) FROM (SELECT * FROM user_progress ORDER BY id) t), '[]'::json),
        'achievements', COALESCE((SELECT json_agg(row_to_json(t)) FROM (SELECT * FROM achievements ORDER BY id) t), '[]'::json),
        'user_achievements', COALESCE((SELECT json_agg(row_to_json(t)) FROM (SELECT * FROM user_achievements ORDER BY id) t), '[]'::json),
        'user_stats', COALESCE((SELECT json_agg(row_to_json(t)) FROM (SELECT * FROM user_stats ORDER BY id) t), '[]'::json),
        'eod_price_report', COALESCE((SELECT json_agg(row_to_json(t)) FROM (SELECT * FROM eod_price_report ORDER BY trade_date DESC, symbol LIMIT 50000) t), '[]'::json)
    )
) TO STDOUT
" > "$JSON_EXPORT"

# Create pretty-formatted JSON
echo "🎨 Formatting JSON for readability..."
if command -v jq &> /dev/null; then
    jq '.' "$JSON_EXPORT" > "${JSON_EXPORT}.tmp" && mv "${JSON_EXPORT}.tmp" "$JSON_EXPORT"
else
    echo "ℹ️  jq not available, JSON export will be minified"
fi

# Create latest export symlink
cp "$JSON_EXPORT" "$LATEST_EXPORT"

# Compress the timestamped export to save space
echo "🗜️ Compressing JSON export..."
gzip "$JSON_EXPORT"

# Clean up old exports (keep last 20)
echo "🧹 Cleaning up old exports..."
cd "${EXPORT_DIR}"
ls -t database_export_*.json.gz 2>/dev/null | tail -n +21 | xargs -r rm

echo "✅ JSON export completed successfully!"
echo "📁 Export files created:"
echo "   - Compressed: ${JSON_EXPORT}.gz"
echo "   - Latest: ${LATEST_EXPORT}"

# Get file sizes for reporting
COMPRESSED_SIZE=$(du -h "${JSON_EXPORT}.gz" | cut -f1)
LATEST_SIZE=$(du -h "$LATEST_EXPORT" | cut -f1)

echo "📊 Export statistics:"
echo "   - Compressed size: $COMPRESSED_SIZE"
echo "   - Uncompressed size: $LATEST_SIZE"

# Add to git if in a git repository
if [ -d "${EXPORT_DIR}" ] && cd "${EXPORT_DIR}" && git rev-parse --git-dir > /dev/null 2>&1; then
    echo "🔗 Adding JSON exports to git repository..."
    git add *.json *.json.gz 2>/dev/null || echo "ℹ️ No export files to add to git"
    git commit -m "JSON data export: $(date '+%Y-%m-%d %H:%M:%S')" 2>/dev/null || echo "ℹ️ No changes to commit"
    cd - > /dev/null
fi

echo "🎉 JSON export process completed at $(date)"