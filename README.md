# VisaRun

This repository contains the code for **VisaRun**, a full‑stack application for managing visa runs. The project is organised as a pnpm monorepo and consists of three main packages:

- `backend` – Express API using tRPC and Prisma
- `webapp` – React + Vite front‑end
- `telegram-bot` – Node.js Telegram bot using node-telegram-bot-api

## ✅ Development Status

**All services are configured and working:**
- ✅ **Database (PostgreSQL)** - localhost:5432 (healthy)
- ✅ **Backend API** - http://localhost:3001 (running with migrations)
- ✅ **Frontend** - http://localhost:5173 (accessible)
- ✅ **Telegram Bot** - running with nodemon (hot reload)

**Test access:**
- Admin login: `admin@admin.com` / password: `admin`
- API Health: http://localhost:3001/trpc/health

## 🚀 Quick Start

### 1. Setup Environment
```bash
# Copy environment template
cp .env.example .env

# Edit .env and set your Telegram bot credentials:
nano .env

# Required: TELEGRAM_BOT_TOKEN and TELEGRAM_BOT_USERNAME
# The file is pre-configured for development
```

### 2. Install Dependencies & Start Services
```bash
# Install telegram-bot dependencies locally (required for Docker volumes)
cd telegram-bot && pnpm install --ignore-workspace && cd ..

# Start all services
docker compose -f compose.dev.yml up -d --build

# Initialize database (first time only)
docker compose -f compose.dev.yml exec -T backend sh -c "cd /app/backend && pnpm pmd"
```

### 3. Access Services
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3001
- **Database**: localhost:5432
- **Telegram Bot**: running in background

## 📋 Common Commands

```bash
# Start services in background
docker compose -f compose.dev.yml up -d

# Start with logs
docker compose -f compose.dev.yml up

# Stop services
docker compose -f compose.dev.yml down

# Restart services
docker compose -f compose.dev.yml restart

# Check status
docker compose -f compose.dev.yml ps

# View logs
docker compose -f compose.dev.yml logs -f

# View specific service logs
docker compose -f compose.dev.yml logs -f backend
docker compose -f compose.dev.yml logs -f webapp
docker compose -f compose.dev.yml logs -f telegram-bot
```

## 🗄️ Database Operations

```bash
# PostgreSQL console
docker compose -f compose.dev.yml exec db psql -U postgres -d visarun

# Prisma Studio (web interface at http://localhost:5555)
docker compose -f compose.dev.yml exec backend pnpm prisma studio

# Create new migration
docker compose -f compose.dev.yml exec -T backend sh -c "cd /app/backend && pnpm pmd --name 'migration_name'"

# Generate Prisma client
docker compose -f compose.dev.yml exec -T backend sh -c "cd /app/backend && pnpm pgc"

# Seed database with test data
docker compose -f compose.dev.yml exec -T backend sh -c "cd /app/backend && pnpm prisma:seed"
```

## 🔧 Development

### Hot Reload
All services support automatic reloading on code changes:
- **Backend**: `tsx watch` monitors TypeScript files
- **Frontend**: Vite HMR for instant updates
- **Telegram Bot**: `nodemon` restarts on JavaScript changes

### Adding Dependencies

**For backend and webapp:**
```bash
docker compose -f compose.dev.yml down
docker compose -f compose.dev.yml build
docker compose -f compose.dev.yml up -d
```

**For telegram-bot:**
```bash
# Install dependencies locally
cd telegram-bot && pnpm install --ignore-workspace
# Restart container
docker compose -f compose.dev.yml restart telegram-bot
```

### Debugging
```bash
# Connect to containers
docker compose -f compose.dev.yml exec backend sh
docker compose -f compose.dev.yml exec webapp sh
docker compose -f compose.dev.yml exec telegram-bot sh
docker compose -f compose.dev.yml exec db sh
```

## ⚙️ Configuration

### Repository Layout
```
visarun/
├── backend/                    # API server (Node.js + tRPC + Prisma)
├── webapp/                     # Frontend (React + Vite)
├── telegram-bot/               # Telegram bot (Node.js)
│   ├── Dockerfile             # Dockerfile for telegram bot
│   └── node_modules/          # Local dependencies (required)
├── compose.dev.yml             # Docker Compose configuration
├── Dockerfile                  # Multi-stage for backend/webapp
├── .env.example               # Environment template
├── .env                       # Your environment variables (created from example)
└── generate-secrets.sh        # Production secrets generator
```

### Environment Variables

**Single `.env` file approach:**
- Copy `.env.example` to `.env`
- For development: Use default values, just add Telegram bot credentials
- For production: Run `./generate-secrets.sh` to set production values
- Update `TELEGRAM_BOT_TOKEN` and `TELEGRAM_BOT_USERNAME` in both cases

**Required Variables:**
- `TELEGRAM_BOT_TOKEN` - Get from @BotFather on Telegram
- `TELEGRAM_BOT_USERNAME` - Your bot's username (without @)

**Development defaults (already set in .env.example):**
- Database: postgres/postgres/visarun on localhost:5432
- API URLs: localhost for frontend, internal Docker network for services
- JWT_SECRET: development default (change for production)

### Ports
- **5173** - Frontend
- **3001** - Backend API
- **5432** - PostgreSQL Database

## 🚀 Production Deployment

### 1. Generate Production Environment
```bash
# Create .env with production-ready secrets
./generate-secrets.sh
```

This script will:
- Copy `.env.example` to `.env`
- Generate secure JWT secret, session secret, and database password
- Switch to production URLs and settings
- Set secure file permissions

### 2. Configure Production Values
```bash
# Edit the generated .env file
nano .env
```

**Update these values:**
- `TELEGRAM_BOT_TOKEN` - Your actual bot token from @BotFather
- `TELEGRAM_BOT_USERNAME` - Your bot's username
- Replace `yourdomain.com` with your actual domain in all URL fields

### 3. Deploy Production Services
```bash
# Build and start production containers
docker compose -f compose.prod.yml up -d --build

# Check service status
docker compose -f compose.prod.yml ps

# View logs
docker compose -f compose.prod.yml logs -f
```

### Production Notes
- Database port is not exposed externally for security
- Frontend serves on port 80, backend on port 3001
- All data persisted in Docker volumes
- Configure your reverse proxy to handle SSL and forward requests

## 🛠️ Troubleshooting

### Backend can't connect to database
```bash
# Check database status
docker compose -f compose.dev.yml ps db

# View database logs
docker compose -f compose.dev.yml logs db

# Restart services
docker compose -f compose.dev.yml restart
```

### Telegram bot not responding
1. Check token in `.env` file
2. Ensure bot is added to chats with admin rights
3. Check local dependencies: `ls telegram-bot/node_modules`
4. If missing: `cd telegram-bot && pnpm install --ignore-workspace`

### Production Issues
```bash
# Check all production services
docker compose -f compose.prod.yml ps

# View specific service logs
docker compose -f compose.prod.yml logs backend
docker compose -f compose.prod.yml logs telegram-bot

# Database health check
docker compose -f compose.prod.yml exec postgres POSTGRES_isready -U visarun_prod
```

### Ports already in use
```bash
# Check what's using the ports
sudo lsof -i :5173  # Frontend
sudo lsof -i :3001  # Backend
sudo lsof -i :5432  # Database

# Stop conflicting services or change ports in compose files
```

## 📝 Environment Variables Reference

### Development (default in .env.example)
```bash
NODE_ENV=development
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=visarun
JWT_SECRET=dev-jwt-secret-change-for-production
BACKEND_URL=http://backend:3001
VITE_API_URL=http://localhost:3001
```

### Production (set by generate-secrets.sh)
```bash
NODE_ENV=production
POSTGRES_USER=visarun_prod
POSTGRES_PASSWORD=<generated-secure-password>
POSTGRES_DB=visarun_production
JWT_SECRET=<generated-64-char-secret>
BACKEND_URL=https://yourdomain.com
VITE_API_URL=https://yourdomain.com
```

## 🔒 Security Notes

- Never commit `.env` file to version control (it's git-ignored)
- Use strong secrets for production (generated automatically)
- Production database is not exposed externally
- Configure reverse proxy with SSL certificates
- Rotate secrets periodically for production deployments

## 🔧 Advanced Configuration

### Port Configuration
Edit compose files to change external ports if needed:
```yaml
services:
  webapp:
    ports:
      - "3000:5173"  # Change external port to 3000
  backend:
    ports:
      - "8080:3001"  # Change external port to 8080
```

### Development Reset
```bash
# Stop and remove all containers
docker compose -f compose.dev.yml down -v

# Rebuild from scratch
docker compose -f compose.dev.yml up -d --build --force-recreate

# Remove unused images
docker system prune -f
```

### Production Reset
```bash
# Stop production services
docker compose -f compose.prod.yml down -v

# Rebuild production
docker compose -f compose.prod.yml up -d --build --force-recreate
```

## 🏗️ System Components

### Backend (port 3001)
- **Technologies**: Node.js, Express, tRPC, Prisma
- **Database**: PostgreSQL
- **API**: REST + tRPC for type-safe requests

### Frontend (port 5173)
- **Technologies**: React, Vite, TypeScript
- **UI**: Tailwind CSS + Radix UI components
- **State**: React Query + tRPC client

### Telegram Bot
- **Technologies**: Node.js, node-telegram-bot-api, nodemon
- **Features**: Command handling, notifications, API integration
- **Notes**:
  - Uses local `node_modules` (not workspace)
  - Requires: `cd telegram-bot && pnpm install --ignore-workspace`
  - Supports hot reload via nodemon

### Database (port 5432)
- **DBMS**: PostgreSQL 17
- **ORM**: Prisma for migrations and typing
- **Data**: Users, roles, exchange rates, channels

All components communicate through internal Docker network and are configured for hot reload during development.

## 📜 Legacy Commands

For non-Docker development (if needed):

```bash
# Install dependencies
pnpm install

# Start development servers
pnpm dev

# Initialize database
cd backend && pnpm pmd && pnpm prisma:seed
```

## License

This project is licensed under the terms of the repository's LICENSE file.
