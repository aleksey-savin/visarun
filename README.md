# VisaRun Monorepo

This repository contains the code for **VisaRun**, a full‑stack application for managing visa runs. The project is organised as a pnpm monorepo and consists of three main packages:

- `backend` – Express API using tRPC and Prisma
- `webapp` – React + Vite front‑end
- `telegram-bot` – Node.js Telegram bot using node-telegram-bot-api

## Development

Install dependencies with [pnpm](https://pnpm.io):

```bash
pnpm install
```

### System Initialization

Before running the application for the first time, you need to initialize the database with required data:

```bash
cd backend
pnpm prisma:seed
```

This will create:
- System permissions
- System roles (admin, client) with proper constraints
- Default admin user (if no users exist)

The default admin credentials are:
- Email: admin@admin.com
- Password: admin

**Important:** Change the default password after first login!

### Running the Application

To start both the API and the web client in development mode run:

```bash
pnpm dev
```

Docker compose files are provided for local development and production builds:

```bash
# Development containers
docker compose -f compose.dev.yml up

# Production containers
docker compose -f compose.prod.yml up
```

## Repository Layout

```
backend/        Node.js API source
webapp/         React front-end
telegram-bot/   Telegram bot
Dockerfile*     Container images for dev and production
compose*.yml    Docker compose configurations
```

Each package contains its own `package.json` with additional scripts and configuration.

## License

This project is licensed under the terms of the repository's LICENSE file.
