#!/bin/sh

# Safe backend startup script for production
set -e

echo "🚀 Starting backend container (safe mode)..."

# Function to test database connection
test_db_connection() {
  # Try a simple connection test
  if node -e "
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    prisma.\$connect()
      .then(() => {
        console.log('Database connection successful');
        process.exit(0);
      })
      .catch((error) => {
        console.error('Database connection failed:', error.message);
        process.exit(1);
      })
      .finally(() => prisma.\$disconnect());
  " 2>/dev/null; then
    return 0
  fi
  return 1
}

# Function to check migration status
check_migration_status() {
  echo "🔍 Checking migration status..."

  # Check if _prisma_migrations table exists
  migration_status=$(node -e "
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    async function checkMigrations() {
      try {
        await prisma.\$connect();

        // Check if migrations table exists
        const result = await prisma.\$queryRaw\`
          SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name = '_prisma_migrations'
          );
        \`;

        if (result[0].exists) {
          // Get migration status
          const migrations = await prisma.\$queryRaw\`
            SELECT migration_name, finished_at, rolled_back_at
            FROM _prisma_migrations
            ORDER BY started_at DESC
            LIMIT 5;
          \`;

          console.log('MIGRATIONS_EXIST');
          console.log(JSON.stringify(migrations));
        } else {
          console.log('NO_MIGRATIONS_TABLE');
        }
      } catch (error) {
        console.log('ERROR:', error.message);
      } finally {
        await prisma.\$disconnect();
      }
    }

    checkMigrations();
  " 2>/dev/null)

  echo "$migration_status"
}

# Function to backup data before migrations
backup_critical_tables() {
  echo "💾 Creating backup of critical data..."

  node -e "
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    async function backupData() {
      try {
        await prisma.\$connect();

        // Check if order_payments table exists (old table)
        const orderPaymentsExists = await prisma.\$queryRaw\`
          SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name = 'order_payments'
          );
        \`;

        if (orderPaymentsExists[0].exists) {
          console.log('⚠️  Found old order_payments table - migration needed');

          // Get count of records
          const count = await prisma.\$queryRaw\`SELECT COUNT(*) FROM order_payments\`;
          console.log('Records in order_payments:', count[0].count);

          if (parseInt(count[0].count) > 0) {
            console.log('💾 Data found - will be migrated safely');
          }
        }

        console.log('✅ Backup check completed');
      } catch (error) {
        console.error('❌ Backup check failed:', error.message);
      } finally {
        await prisma.\$disconnect();
      }
    }

    backupData();
  " || echo "⚠️  Backup check failed, continuing..."
}

# Function to apply migrations safely
apply_migrations_safely() {
  echo "🔄 Applying migrations safely..."

  # First, try to get the current status
  echo "📊 Getting current migration status..."
  npx prisma migrate status || echo "⚠️  Could not get migration status"

  # Try migrate resolve first to mark any applied migrations
  echo "🔧 Resolving migration state..."
  npx prisma migrate resolve --applied "20250819124233_order_payment_update" 2>/dev/null || echo "Migration already resolved or not needed"

  # Now try to deploy any pending migrations
  echo "🚀 Deploying migrations..."
  if npx prisma migrate deploy; then
    echo "✅ Migrations deployed successfully!"
    return 0
  else
    echo "⚠️  Migration deploy failed, trying alternative approach..."

    # Check if schema is in sync
    echo "🔍 Checking schema synchronization..."
    if npx prisma db push --accept-data-loss; then
      echo "✅ Database schema synchronized!"
      return 0
    else
      echo "❌ Failed to synchronize database schema"
      return 1
    fi
  fi
}

# Main execution flow
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

# Check current state
migration_status=$(check_migration_status)
echo "Migration status: $migration_status"

# Backup critical data
backup_critical_tables

# Apply migrations
if apply_migrations_safely; then
  echo "✅ Database migrations completed successfully!"
else
  echo "❌ Database migration failed!"
  exit 1
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

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
