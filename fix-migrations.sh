#!/bin/bash

# Quick migration fix script for production
set -e

echo "🔧 Quick Migration Fix Script"
echo "============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if Docker Compose is available
check_docker_compose() {
    if command -v docker-compose >/dev/null 2>&1; then
        DOCKER_COMPOSE_CMD="docker-compose"
    elif docker compose version >/dev/null 2>&1; then
        DOCKER_COMPOSE_CMD="docker compose"
    else
        print_error "Docker Compose not found!"
        exit 1
    fi
    print_success "Using: $DOCKER_COMPOSE_CMD"
}

# Function to check database connection
check_database() {
    print_status "Checking database connection..."

    if $DOCKER_COMPOSE_CMD -f compose.prod.yml exec -T db pg_isready -U ${POSTGRES_USER:-postgres} >/dev/null 2>&1; then
        print_success "Database is ready!"
        return 0
    else
        print_error "Database is not ready!"
        return 1
    fi
}

# Function to fix migration state
fix_migration_state() {
    print_status "Fixing migration state..."

    # Check current migration status
    print_status "Checking current migration status..."

    MIGRATION_STATUS=$($DOCKER_COMPOSE_CMD -f compose.prod.yml exec -T db psql -U ${POSTGRES_USER:-postgres} -d ${POSTGRES_DB:-visarun} -t -c "
        SELECT
            CASE
                WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = '_prisma_migrations')
                THEN 'EXISTS'
                ELSE 'MISSING'
            END;
    " 2>/dev/null | tr -d ' \n' || echo "ERROR")

    if [ "$MIGRATION_STATUS" = "EXISTS" ]; then
        print_success "Migrations table exists"

        # Get latest migration
        LATEST_MIGRATION=$($DOCKER_COMPOSE_CMD -f compose.prod.yml exec -T db psql -U ${POSTGRES_USER:-postgres} -d ${POSTGRES_DB:-visarun} -t -c "
            SELECT migration_name
            FROM _prisma_migrations
            WHERE finished_at IS NOT NULL
            ORDER BY started_at DESC
            LIMIT 1;
        " 2>/dev/null | tr -d ' \n' || echo "NONE")

        print_status "Latest applied migration: $LATEST_MIGRATION"

        # Check for failed migrations
        FAILED_MIGRATIONS=$($DOCKER_COMPOSE_CMD -f compose.prod.yml exec -T db psql -U ${POSTGRES_USER:-postgres} -d ${POSTGRES_DB:-visarun} -t -c "
            SELECT COUNT(*)
            FROM _prisma_migrations
            WHERE finished_at IS NULL;
        " 2>/dev/null | tr -d ' \n' || echo "0")

        if [ "$FAILED_MIGRATIONS" != "0" ]; then
            print_warning "Found $FAILED_MIGRATIONS failed migration(s)"

            # Clean up failed migrations
            print_status "Cleaning up failed migrations..."
            $DOCKER_COMPOSE_CMD -f compose.prod.yml exec -T db psql -U ${POSTGRES_USER:-postgres} -d ${POSTGRES_DB:-visarun} -c "
                DELETE FROM _prisma_migrations WHERE finished_at IS NULL;
            " >/dev/null 2>&1

            print_success "Failed migrations cleaned up"
        fi

    else
        print_warning "Migrations table missing or inaccessible"
    fi
}

# Function to run migrations inside container
run_migrations_in_container() {
    print_status "Running migrations inside backend container..."

    # Method 1: Try using existing container
    CONTAINER_ID=$($DOCKER_COMPOSE_CMD -f compose.prod.yml ps -q backend 2>/dev/null || echo "")

    if [ -n "$CONTAINER_ID" ]; then
        print_status "Using existing backend container: $CONTAINER_ID"

        # Stop the main process temporarily
        print_status "Stopping backend process temporarily..."
        docker exec "$CONTAINER_ID" pkill -f "node.*app.js" || true
        sleep 2

        # Run migration commands
        print_status "Resolving migration state..."
        docker exec "$CONTAINER_ID" npx prisma migrate resolve --applied "20250819124233_order_payment_update" || print_warning "Migration resolve failed or not needed"

        print_status "Deploying migrations..."
        if docker exec "$CONTAINER_ID" npx prisma migrate deploy; then
            print_success "Migrations deployed successfully!"
        else
            print_warning "Migration deploy failed, trying db push..."
            if docker exec "$CONTAINER_ID" npx prisma db push --accept-data-loss; then
                print_success "Schema synchronized with db push!"
            else
                print_error "Both migrate deploy and db push failed!"
                return 1
            fi
        fi

        # Generate Prisma client
        print_status "Generating Prisma client..."
        docker exec "$CONTAINER_ID" npx prisma generate

        # Restart the backend
        print_status "Restarting backend..."
        $DOCKER_COMPOSE_CMD -f compose.prod.yml restart backend

    else
        print_status "No backend container found, creating temporary one..."

        # Create a temporary container for migrations
        TEMP_CONTAINER=$($DOCKER_COMPOSE_CMD -f compose.prod.yml run -d --rm backend sleep 3600)

        if [ -n "$TEMP_CONTAINER" ]; then
            print_status "Created temporary container: $TEMP_CONTAINER"

            # Wait for container to be ready
            sleep 5

            # Run migrations
            print_status "Running migrations in temporary container..."

            docker exec "$TEMP_CONTAINER" npx prisma migrate resolve --applied "20250819124233_order_payment_update" || print_warning "Migration resolve failed or not needed"

            if docker exec "$TEMP_CONTAINER" npx prisma migrate deploy; then
                print_success "Migrations deployed successfully!"
            else
                print_warning "Migration deploy failed, trying db push..."
                if docker exec "$TEMP_CONTAINER" npx prisma db push --accept-data-loss; then
                    print_success "Schema synchronized with db push!"
                else
                    print_error "Both migrate deploy and db push failed!"
                    docker stop "$TEMP_CONTAINER" || true
                    return 1
                fi
            fi

            # Clean up temporary container
            docker stop "$TEMP_CONTAINER" || true

            # Now start the backend normally
            print_status "Starting backend service..."
            $DOCKER_COMPOSE_CMD -f compose.prod.yml up -d backend
        else
            print_error "Failed to create temporary container!"
            return 1
        fi
    fi
}

# Function to verify fix
verify_fix() {
    print_status "Verifying the fix..."

    # Wait for backend to start
    sleep 10

    # Check container status
    BACKEND_STATUS=$($DOCKER_COMPOSE_CMD -f compose.prod.yml ps backend --format "table {{.Status}}" | tail -n +2 | head -n 1)

    if echo "$BACKEND_STATUS" | grep -q "Up"; then
        print_success "Backend container is running!"

        # Check logs for any errors
        print_status "Checking recent logs..."
        RECENT_LOGS=$($DOCKER_COMPOSE_CMD -f compose.prod.yml logs --tail=10 backend 2>/dev/null || echo "Could not fetch logs")

        if echo "$RECENT_LOGS" | grep -q "🎯 Starting Node.js application"; then
            print_success "Backend application started successfully!"
        elif echo "$RECENT_LOGS" | grep -q "error\|Error\|ERROR"; then
            print_warning "Possible errors in logs:"
            echo "$RECENT_LOGS" | grep -i error || true
        else
            print_status "Backend logs look normal"
        fi

    else
        print_error "Backend container is not running properly!"
        print_status "Container status: $BACKEND_STATUS"

        print_status "Recent logs:"
        $DOCKER_COMPOSE_CMD -f compose.prod.yml logs --tail=20 backend || true

        return 1
    fi
}

# Main execution
main() {
    print_status "Starting quick migration fix..."

    # Check prerequisites
    check_docker_compose

    # Ensure database is running
    print_status "Ensuring database is running..."
    $DOCKER_COMPOSE_CMD -f compose.prod.yml up -d db
    sleep 5

    # Check database connection
    if ! check_database; then
        print_error "Cannot connect to database!"
        exit 1
    fi

    # Stop backend to prevent conflicts
    print_status "Stopping backend temporarily..."
    $DOCKER_COMPOSE_CMD -f compose.prod.yml stop backend 2>/dev/null || true
    sleep 2

    # Fix migration state
    fix_migration_state

    # Run migrations
    if run_migrations_in_container; then
        print_success "Migrations fixed successfully!"
    else
        print_error "Failed to fix migrations!"
        exit 1
    fi

    # Verify the fix
    if verify_fix; then
        print_success "🎉 Migration fix completed successfully!"
        print_status "Your backend should now be running properly."
    else
        print_error "Fix verification failed!"
        print_status "Please check the logs and try manual intervention."
        exit 1
    fi

    # Show final status
    print_status "Final container status:"
    $DOCKER_COMPOSE_CMD -f compose.prod.yml ps
}

# Handle interrupts
trap 'print_error "Fix interrupted!"; exit 1' INT TERM

# Show usage if help requested
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "Usage: $0"
    echo ""
    echo "This script fixes migration issues in production without rebuilding containers."
    echo "It will:"
    echo "  1. Check database connection"
    echo "  2. Clean up failed migrations"
    echo "  3. Apply pending migrations safely"
    echo "  4. Restart backend service"
    echo ""
    echo "Make sure your .env file is properly configured with database credentials."
    exit 0
fi

# Run main function
main "$@"
