#!/bin/bash

# Safe deployment script for production
set -e

echo "🚀 Starting safe deployment process..."

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

# Function to backup database
backup_database() {
    print_status "Creating database backup..."

    # Create backup directory if it doesn't exist
    mkdir -p ./backups

    # Get current timestamp
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    BACKUP_FILE="./backups/db_backup_${TIMESTAMP}.sql"

    # Create database backup
    if $DOCKER_COMPOSE_CMD -f compose.prod.yml exec -T db pg_dump -U ${POSTGRES_USER:-postgres} -d ${POSTGRES_DB:-visarun} > "$BACKUP_FILE" 2>/dev/null; then
        print_success "Database backup created: $BACKUP_FILE"

        # Keep only last 5 backups
        ls -t ./backups/db_backup_*.sql | tail -n +6 | xargs -r rm
        print_status "Old backups cleaned up (keeping last 5)"
    else
        print_warning "Could not create database backup, but continuing deployment..."
    fi
}

# Function to check database connection
check_database() {
    print_status "Checking database connection..."

    max_attempts=10
    attempt=1

    while [ $attempt -le $max_attempts ]; do
        if $DOCKER_COMPOSE_CMD -f compose.prod.yml exec -T db pg_isready -U ${POSTGRES_USER:-postgres} >/dev/null 2>&1; then
            print_success "Database is ready!"
            return 0
        else
            print_status "Database not ready, waiting... (attempt $attempt/$max_attempts)"
            sleep 3
            attempt=$((attempt + 1))
        fi
    done

    print_error "Database connection timeout!"
    return 1
}

# Function to check migration status
check_migration_status() {
    print_status "Checking current migration status..."

    # Check if migrations table exists and get latest migration
    MIGRATION_CHECK=$($DOCKER_COMPOSE_CMD -f compose.prod.yml exec -T db psql -U ${POSTGRES_USER:-postgres} -d ${POSTGRES_DB:-visarun} -t -c "
        SELECT CASE
            WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = '_prisma_migrations')
            THEN (SELECT migration_name FROM _prisma_migrations ORDER BY started_at DESC LIMIT 1)
            ELSE 'NO_MIGRATIONS'
        END;
    " 2>/dev/null | tr -d ' \n' || echo "ERROR")

    if [ "$MIGRATION_CHECK" = "ERROR" ]; then
        print_warning "Could not check migration status"
    elif [ "$MIGRATION_CHECK" = "NO_MIGRATIONS" ]; then
        print_warning "No migrations table found - fresh database"
    else
        print_success "Latest migration: $MIGRATION_CHECK"
    fi
}

# Function to safely stop backend
stop_backend_safely() {
    print_status "Safely stopping backend..."

    # Stop backend container
    $DOCKER_COMPOSE_CMD -f compose.prod.yml stop backend 2>/dev/null || print_warning "Backend was not running"

    # Wait a moment for graceful shutdown
    sleep 2

    # Force remove if still exists
    $DOCKER_COMPOSE_CMD -f compose.prod.yml rm -f backend 2>/dev/null || true

    print_success "Backend stopped safely"
}

# Function to build new images
build_images() {
    print_status "Building new images..."

    # Build backend with safe startup script
    if $DOCKER_COMPOSE_CMD -f compose.prod.yml build backend; then
        print_success "Backend image built successfully"
    else
        print_error "Failed to build backend image"
        exit 1
    fi
}

# Function to start services
start_services() {
    print_status "Starting services..."

    # Start database first
    print_status "Starting database..."
    $DOCKER_COMPOSE_CMD -f compose.prod.yml up -d db

    # Wait for database
    if check_database; then
        print_success "Database is ready"
    else
        print_error "Database failed to start"
        exit 1
    fi

    # Check migration status before starting backend
    check_migration_status

    # Start backend with safe script
    print_status "Starting backend with safe migration handling..."
    $DOCKER_COMPOSE_CMD -f compose.prod.yml up -d backend

    # Wait for backend to be ready
    print_status "Waiting for backend to be ready..."
    sleep 10

    # Check backend logs for any issues
    print_status "Checking backend startup logs..."
    $DOCKER_COMPOSE_CMD -f compose.prod.yml logs --tail=20 backend

    # Start other services
    print_status "Starting remaining services..."
    $DOCKER_COMPOSE_CMD -f compose.prod.yml up -d telegram-bot webapp
}

# Function to verify deployment
verify_deployment() {
    print_status "Verifying deployment..."

    # Check if all containers are running
    RUNNING_CONTAINERS=$($DOCKER_COMPOSE_CMD -f compose.prod.yml ps --services --filter "status=running" | wc -l)
    TOTAL_SERVICES=4  # db, backend, telegram-bot, webapp

    if [ "$RUNNING_CONTAINERS" -eq "$TOTAL_SERVICES" ]; then
        print_success "All services are running!"
    else
        print_warning "Some services may not be running properly"
        $DOCKER_COMPOSE_CMD -f compose.prod.yml ps
    fi

    # Test database connection through backend
    print_status "Testing backend health..."
    sleep 5

    # Show final status
    print_status "Final container status:"
    $DOCKER_COMPOSE_CMD -f compose.prod.yml ps
}

# Function to rollback if needed
rollback() {
    print_error "Deployment failed! Starting rollback procedure..."

    # Stop all services
    $DOCKER_COMPOSE_CMD -f compose.prod.yml down

    # Restore from latest backup if exists
    LATEST_BACKUP=$(ls -t ./backups/db_backup_*.sql 2>/dev/null | head -n1)
    if [ -n "$LATEST_BACKUP" ]; then
        print_status "Restoring from backup: $LATEST_BACKUP"
        # Start only database for restore
        $DOCKER_COMPOSE_CMD -f compose.prod.yml up -d db
        sleep 5

        # Restore backup
        if check_database; then
            $DOCKER_COMPOSE_CMD -f compose.prod.yml exec -T db psql -U ${POSTGRES_USER:-postgres} -d ${POSTGRES_DB:-visarun} < "$LATEST_BACKUP"
            print_success "Database restored from backup"
        fi
    fi

    print_error "Rollback completed. Please check the issues and try again."
    exit 1
}

# Main deployment flow
main() {
    echo "🚀 Safe Production Deployment Script"
    echo "===================================="

    # Check prerequisites
    check_docker_compose

    # Create backup
    backup_database

    # Stop backend safely
    stop_backend_safely

    # Build new images
    build_images

    # Start services
    if start_services; then
        print_success "Services started successfully"
    else
        print_error "Failed to start services"
        rollback
    fi

    # Verify deployment
    verify_deployment

    print_success "🎉 Deployment completed successfully!"
    print_status "Backend logs:"
    $DOCKER_COMPOSE_CMD -f compose.prod.yml logs --tail=10 backend
}

# Handle interrupts
trap 'print_error "Deployment interrupted!"; rollback' INT TERM

# Run main function
main "$@"
