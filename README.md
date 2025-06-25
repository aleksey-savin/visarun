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
# Copy environment variables
cp .env.dev.example .env

# Edit .env and set:
# TELEGRAM_BOT_TOKEN=your_bot_token
# JWT_SECRET=any_long_string
```

### 2. Install Dependencies & Start Services
```bash
# Install telegram-bot dependencies locally (required for Docker volumes)
cd telegram-bot && pnpm install --ignore-workspace && cd ..

# Start all services
docker compose -f compose.dev.yml up -d

# Initialize database (first time only)
docker compose -f compose.dev.yml exec -T backend sh -c "cd /app/backend && pnpm pmd"
docker compose -f compose.dev.yml exec -T backend sh -c "cd /app/backend && pnpm prisma:seed"
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
├── .env.dev.example           # Environment variables example
└── .env                       # Your environment variables
```

### Environment Variables (.env)

**Required:**
- `TELEGRAM_BOT_TOKEN` - Bot token from @BotFather
- `JWT_SECRET` - Secret key for JWT tokens

**Optional (have defaults):**
- `DB_USER=postgres` - Database user
- `DB_PASSWORD=postgres` - Database password  
- `DB_NAME=visarun` - Database name

### Ports
- **5173** - Frontend
- **3001** - Backend API
- **5432** - PostgreSQL Database

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
5. Check logs: `docker compose -f compose.dev.yml logs telegram-bot`

### Ports already in use
Edit `compose.dev.yml` to change external ports:
```yaml
services:
  webapp:
    ports:
      - "3000:5173"  # Change external port to 3000
  backend:
    ports:
      - "8080:3001"  # Change external port to 8080
```

### File sync issues (Windows/macOS)
1. Ensure Docker Desktop is properly configured
2. Check file system settings in Docker Desktop
3. Use WSL2 on Windows if needed

### Permission issues (Linux)
```bash
# Fix file permissions
sudo chown -R $USER:$USER ./backend ./webapp ./telegram-bot
```

### Clean reset
```bash
# Stop and remove all data
docker compose -f compose.dev.yml down -v

# Remove unused images
docker system prune -f
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