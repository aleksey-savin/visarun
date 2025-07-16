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

# Run database migrations
echo "🔄 Running database migrations..."
npx prisma migrate deploy

# Generate Prisma client (in case it's needed)
echo "🔧 Generating Prisma client..."
npx prisma generate

echo "🎯 Starting Node.js application..."
exec node --trace-warnings dist/src/app.js
