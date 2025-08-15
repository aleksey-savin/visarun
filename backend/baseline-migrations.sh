#!/bin/sh

# Baseline script to resolve P3005 migration error
# This script marks all existing migrations as applied to an existing database

set -e

echo "🔧 Baseline Migration Script"
echo "============================"
echo ""
echo "This script will mark all migrations as applied to resolve the P3005 error."
echo "Use this when you have an existing database with schema but no migration history."
echo ""

# Check if we're in the right directory
if [ ! -f "prisma/schema.prisma" ]; then
    echo "❌ Error: prisma/schema.prisma not found. Please run this script from the backend directory."
    exit 1
fi

# Check if migrations directory exists
if [ ! -d "prisma/migrations" ]; then
    echo "❌ Error: prisma/migrations directory not found."
    exit 1
fi

echo "📋 Found the following migrations:"
ls -1 prisma/migrations/ | grep -v migration_lock.toml || true
echo ""

read -p "Do you want to mark ALL these migrations as applied? (y/N): " confirm
if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    echo "❌ Cancelled by user"
    exit 1
fi

echo ""
echo "🚀 Starting baseline process..."
echo ""

# Mark all migrations as applied
for migration_dir in prisma/migrations/*/; do
    if [ -d "$migration_dir" ]; then
        migration_name=$(basename "$migration_dir")
        echo "📌 Marking migration as applied: $migration_name"

        if npx prisma migrate resolve --applied "$migration_name"; then
            echo "✅ Successfully marked: $migration_name"
        else
            echo "⚠️  Warning: Failed to mark $migration_name (might already be applied)"
        fi
    fi
done

echo ""
echo "🔄 Checking migration status..."
npx prisma migrate status

echo ""
echo "✅ Baseline complete!"
echo ""
echo "You can now run 'npx prisma migrate deploy' to apply any new migrations."
echo "Or restart your application - it should work normally now."
