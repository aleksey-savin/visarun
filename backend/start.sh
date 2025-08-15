#!/bin/sh

# Backend startup script for production
set -e

echo "🚀 Starting backend container..."

# Function to test database connection without modifying schema
test_db_connection() {
  # Try Prisma client connection first
  if node -e "
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    prisma.\$connect()
      .then(() => process.exit(0))
      .catch(() => process.exit(1))
      .finally(() => prisma.\$disconnect());
  " > /dev/null 2>&1; then
    return 0
  fi

  # Fallback: try a simple Prisma command that doesn't modify schema
  npx prisma migrate status > /dev/null 2>&1
}

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
until test_db_connection; do
  echo "⏳ Database not ready yet, waiting 2 seconds..."
  sleep 2
done

echo "✅ Database is ready!"

# Handle database migrations
echo "🔄 Handling database migrations..."

# For fresh deployments, try migrate deploy first
echo "🤔 Unknown migration status, attempting deploy..."
deploy_output=$(npx prisma migrate deploy 2>&1)
deploy_exit_code=$?

if [ $deploy_exit_code -eq 0 ]; then
  echo "✅ Migrations deployed successfully!"
else
  echo "⚠️  Migration deploy failed, using db push as fallback..."
  echo "Deploy error: $deploy_output"

  if npx prisma db push --accept-data-loss; then
    echo "✅ Database schema synced successfully!"
  else
    echo "❌ Failed to sync database schema"
    exit 1
  fi
fi

# Generate Prisma client (in case it's needed)
echo "🔧 Generating Prisma client..."
npx prisma generate

echo "🎯 Starting Node.js application..."
exec node --trace-warnings dist/src/app.js
