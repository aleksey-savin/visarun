# VisaRun Monorepo

This repository contains the code for **VisaRun**, a full‑stack application for managing visa runs. The project is organised as a pnpm monorepo and consists of three main packages:

- `backend` – Express API using tRPC and Prisma
- `webapp` – React + Vite front‑end
- `telegram-bot` – Telegraf based bot for Telegram

## Development

Install dependencies with [pnpm](https://pnpm.io):

```bash
pnpm install
```

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
