#!/bin/sh

# Backend startup script for production
set -e

echo "🚀 Starting backend container..."

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
until npx prisma db push --accept-data-loss > /dev/null 2>&1; do
  echo "⏳ Database not ready yet, waiting 2 seconds..."
  sleep 2
done

echo "✅ Database is ready!"

# Handle database migrations intelligently
echo "🔄 Handling database migrations..."

# Check migration status
MIGRATION_STATUS=$(npx prisma migrate status --schema=prisma/schema.prisma 2>&1 || echo "MIGRATION_CHECK_FAILED")

if echo "$MIGRATION_STATUS" | grep -q "P3005"; then
  # Database schema is not empty but no migration history
  echo "📋 Database exists but migration history is missing. Attempting to baseline..."

  # Create the _prisma_migrations table and mark all migrations as applied
  echo "🔧 Creating migration history baseline..."

  # Get all migration directories
  for migration_dir in prisma/migrations/*/; do
    if [ -d "$migration_dir" ]; then
      migration_name=$(basename "$migration_dir")
      echo "📌 Marking migration as applied: $migration_name"
      npx prisma migrate resolve --applied "$migration_name" 2>/dev/null || {
        echo "⚠️  Failed to mark $migration_name as applied, continuing..."
      }
    fi
  done

  # Now try to deploy any remaining migrations
  echo "🔄 Deploying any new migrations..."
  npx prisma migrate deploy || {
    echo "⚠️  Migration deploy failed, using db push as fallback..."
    npx prisma db push --accept-data-loss
  }

elif echo "$MIGRATION_STATUS" | grep -q "No pending migrations"; then
  echo "✅ Database is up to date!"

elif echo "$MIGRATION_STATUS" | grep -q "pending migrations"; then
  echo "🔄 Applying pending migrations..."
  npx prisma migrate deploy

elif echo "$MIGRATION_STATUS" | grep -q "No migration found"; then
  echo "🆕 Setting up fresh database..."
  npx prisma migrate deploy

else
  echo "🤔 Unknown migration status, attempting deploy..."
  npx prisma migrate deploy || {
    echo "⚠️  Migration deploy failed, using db push as fallback..."
    npx prisma db push --accept-data-loss
  }
fi

# Generate Prisma client (in case it's needed)
echo "🔧 Generating Prisma client..."
npx prisma generate

echo "🎯 Starting Node.js application..."
exec node --trace-warnings dist/src/app.js
