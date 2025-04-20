FROM node:23-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Set working directory
WORKDIR /app

# Copy workspace configuration
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./

# Copy package.json files with your actual directory structure
COPY ./backend/package.json ./backend/
COPY ./webapp/package.json ./webapp/

# Copy the source code
COPY . .

# Install dependencies
RUN pnpm install

# Backend build stage
FROM base AS backend-dev
WORKDIR /app
EXPOSE 3001
CMD ["pnpm", "--filter", "@visarun/backend", "run", "dev"]

# webapp build stage
FROM base AS webapp-dev
WORKDIR /app
EXPOSE 5173
# Configure Vite to listen on all interfaces and use proper host
CMD ["pnpm", "--filter", "@visarun/webapp", "run", "dev", "--", "--host", "0.0.0.0"]
