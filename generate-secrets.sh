#!/bin/bash

# Generate Production Secrets Script for Visarun
# This script creates .env from .env.example and fills in generated secrets

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# File paths
EXAMPLE_FILE=".env.example"
OUTPUT_FILE=".env"

# Functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to generate a random string
generate_secret() {
    local length=$1
    openssl rand -base64 $length | tr -d "=+/" | cut -c1-$length
}

echo -e "${BLUE}"
echo "🔐 Generating production secrets for Visarun..."
echo "=============================================="
echo -e "${NC}"

# Check if example file exists
if [[ ! -f "$EXAMPLE_FILE" ]]; then
    log_error "Example file $EXAMPLE_FILE not found!"
    exit 1
fi

# Check if output file already exists
if [[ -f "$OUTPUT_FILE" ]]; then
    log_warning "File $OUTPUT_FILE already exists!"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Operation cancelled"
        exit 0
    fi
fi

log_info "Generating secure secrets..."

# Generate secrets
JWT_SECRET=$(generate_secret 64)
SESSION_SECRET=$(generate_secret 48)
POSTGRES_PASSWORD=$(generate_secret 32)

log_success "Generated secrets:"
echo "  • JWT_SECRET (64 chars)"
echo "  • SESSION_SECRET (48 chars)"
echo "  • POSTGRES_PASSWORD (32 chars)"
echo

log_info "Creating $OUTPUT_FILE from $EXAMPLE_FILE..."

# Read the example file and replace placeholders
cp "$EXAMPLE_FILE" "$OUTPUT_FILE"

# Replace the generated secrets using a more robust method
# Use temp file to avoid issues with special characters
TEMP_FILE=$(mktemp)

# Replace secrets line by line
while IFS= read -r line; do
    case "$line" in
        "JWT_SECRET=dev-jwt-secret-change-for-production")
            echo "JWT_SECRET=$JWT_SECRET"
            ;;
        "SESSION_SECRET=dev-session-secret-change-for-production")
            echo "SESSION_SECRET=$SESSION_SECRET"
            ;;
        "POSTGRES_PASSWORD=postgres")
            echo "POSTGRES_PASSWORD=$POSTGRES_PASSWORD"
            ;;
        "NODE_ENV=development")
            echo "NODE_ENV=production"
            ;;
        "# POSTGRES_USER=visarun_prod")
            echo "POSTGRES_USER=visarun_prod"
            ;;
        "# POSTGRES_PASSWORD=your_secure_password_here")
            echo "POSTGRES_PASSWORD=$POSTGRES_PASSWORD"
            ;;
        "# POSTGRES_DB=visarun_production")
            echo "POSTGRES_DB=visarun_production"
            ;;
        "LOG_LEVEL=debug")
            echo "LOG_LEVEL=info"
            ;;
        "# BACKEND_URL=https://yourdomain.com")
            echo "BACKEND_URL=https://yourdomain.com"
            ;;
        "# VITE_BACKEND_URL=https://yourdomain.com")
            echo "VITE_BACKEND_URL=https://yourdomain.com"
            ;;
        "BACKEND_URL=http://backend:3001")
            echo "# BACKEND_URL=http://backend:3001"
            ;;
        "VITE_BACKEND_URL=http://localhost:3001")
            echo "# VITE_BACKEND_URL=http://localhost:3001"
            ;;
        *)
            echo "$line"
            ;;
    esac
done < "$OUTPUT_FILE" > "$TEMP_FILE"

# Move temp file to output file
mv "$TEMP_FILE" "$OUTPUT_FILE"

# Set secure permissions
chmod 600 "$OUTPUT_FILE"

log_success "Created $OUTPUT_FILE with generated secrets"
log_info "Set secure permissions (600) on $OUTPUT_FILE"

echo
log_warning "⚠️  IMPORTANT NEXT STEPS:"
echo "1. Edit $OUTPUT_FILE and update the following values:"
echo "   • TELEGRAM_BOT_TOKEN (get from @BotFather)"
echo "   • TELEGRAM_BOT_USERNAME (your bot's username)"
echo "   • Replace 'yourdomain.com' with your actual domain in URLs"
echo
echo "2. Never commit $OUTPUT_FILE to version control"
echo
echo "📋 Edit the file with:"
echo "   nano $OUTPUT_FILE  # or your preferred editor"
echo
echo "🚀 For development:"
echo "   docker-compose -f compose.dev.yml up -d --build"
echo
echo "🚀 For production:"
echo "   docker-compose -f compose.prod.yml up -d --build"
echo

log_success "✅ Secret generation complete!"
echo
log_info "Generated values preview:"
echo "  POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:0:8}..."
echo "  JWT_SECRET: ${JWT_SECRET:0:16}..."
echo "  SESSION_SECRET: ${SESSION_SECRET:0:16}..."
