#!/bin/sh

# Backend startup script for production
set -e

echo "🚀 Starting backend container..."

# Function to test database connection
test_db_connection() {
  node -e "
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    prisma.\$connect()
      .then(() => process.exit(0))
      .catch(() => process.exit(1))
      .finally(() => prisma.\$disconnect());
  " > /dev/null 2>&1
}

# Function to check migration status safely
check_migration_status() {
  # Check if migrations table exists and get status
  npx prisma migrate status --schema=./prisma/schema.prisma 2>/dev/null | grep -q "Database schema is up to date" && return 0
  return 1
}

# Function to resolve migration conflicts
resolve_migration_conflicts() {
  echo "🔧 Resolving migration conflicts..."

  # Clear any failed migrations from the database
  node -e "
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    async function clearFailedMigrations() {
      try {
        await prisma.\$connect();

        // Check if migrations table exists
        const tables = await prisma.\$queryRaw\`
          SELECT table_name FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = '_prisma_migrations'
        \`;

        if (tables.length > 0) {
          // Remove any failed migrations (those without finished_at)
          const result = await prisma.\$executeRaw\`
            DELETE FROM _prisma_migrations
            WHERE finished_at IS NULL
          \`;

          if (result > 0) {
            console.log('Cleared', result, 'failed migration(s)');
          }
        }
      } catch (error) {
        console.log('Could not clear failed migrations:', error.message);
      } finally {
        await prisma.\$disconnect();
      }
    }

    clearFailedMigrations();
  " || echo "Failed to clear migrations, continuing..."
}

# Function to apply migrations safely
apply_migrations() {
  echo "🔄 Applying database migrations..."

  # First, try to resolve any known problematic migrations
  resolve_migration_conflicts

  # Generate Prisma client first
  echo "🔧 Generating Prisma client..."
  npx prisma generate

  # Try migrate deploy first
  echo "📦 Attempting migrate deploy..."
  if npx prisma migrate deploy; then
    echo "✅ Migrations deployed successfully!"
    return 0
  fi

  # If migrate deploy fails, check what's wrong
  echo "⚠️  Migrate deploy failed, checking database state..."

  # Try to get current schema state
  if npx prisma db pull --force; then
    echo "📥 Current schema pulled successfully"
  fi

  # Try db push as fallback (this will sync schema without migration history)
  echo "🔄 Using db push to sync schema..."
  if npx prisma db push; then
    echo "✅ Database schema synchronized!"
    return 0
  fi

  echo "❌ Failed to apply migrations"
  return 1
}

# Wait for database to be ready with timeout
echo "⏳ Waiting for database to be ready..."
max_attempts=30
attempt=1

while [ $attempt -le $max_attempts ]; do
  if test_db_connection; then
    echo "✅ Database is ready! (attempt $attempt)"
    break
  else
    echo "⏳ Database not ready yet, waiting 2 seconds... (attempt $attempt/$max_attempts)"
    sleep 2
    attempt=$((attempt + 1))
  fi
done

if [ $attempt -gt $max_attempts ]; then
  echo "❌ Database connection timeout after $max_attempts attempts"
  exit 1
fi

# Apply migrations
if apply_migrations; then
  echo "✅ Database setup completed successfully!"
else
  echo "❌ Database setup failed!"
  exit 1
fi

# Final health check
echo "🏥 Running final health check..."
if test_db_connection; then
  echo "✅ Final health check passed!"
else
  echo "❌ Final health check failed!"
  exit 1
fi

echo "🎯 Starting Node.js application..."
exec node --trace-warnings dist/src/app.js
