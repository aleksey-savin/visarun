FROM node:23-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Set working directory
WORKDIR /app

# Copy workspace configuration
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./

# Copy package.json files with directory structure
COPY ./backend/package.json ./backend/
COPY ./webapp/package.json ./webapp/

# Development base - allows lockfile updates
FROM base AS base-dev
RUN pnpm install --ignore-scripts

# Production base - uses frozen lockfile
FROM base AS base-prod
RUN pnpm install --frozen-lockfile --ignore-scripts

# Copy source code and generate Prisma client for both
FROM base-dev AS dev-prepared
COPY . .
RUN cd backend && pnpm prisma generate

FROM base-prod AS prod-prepared
COPY . .
RUN cd backend && pnpm prisma generate

# Backend development stage
FROM dev-prepared AS backend-dev
WORKDIR /app
EXPOSE 3001
CMD ["pnpm", "--filter", "@visarun/backend", "run", "dev"]

# webapp development stage
FROM dev-prepared AS webapp-dev
WORKDIR /app
EXPOSE 5173
# Configure Vite to listen on all interfaces and use proper host
CMD ["pnpm", "--filter", "@visarun/webapp", "run", "dev", "--", "--host", "0.0.0.0"]

FROM prod-prepared AS backend-build
WORKDIR /app
# Install build dependencies
RUN cd backend && pnpm add -D @swc/cli @swc/core
# Use the new build script
RUN pnpm --filter @visarun/backend run build

# Frontend build stage
FROM prod-prepared AS webapp-build
WORKDIR /app
# Set production environment variables if needed
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
RUN pnpm --filter @visarun/webapp run build

# Backend production stage
FROM node:23-alpine AS backend-prod
WORKDIR /app
ENV NODE_ENV=production

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy backend package.json and built files
COPY --from=backend-build /app/backend/package.json ./package.json
COPY --from=backend-build /app/backend/dist ./dist
COPY --from=backend-build /app/backend/prisma ./prisma

# Install production dependencies only (ignore scripts to prevent prepare from running)
RUN pnpm install --prod

# Generate Prisma client manually
ENV DATABASE_URL=${DATABASE_URL:-"postgresql://postgres:postgres@db:5432/visarun"}
RUN npx prisma generate

EXPOSE 3001
# Fixed path to match the actual build output location
CMD ["node", "--trace-warnings", "dist/src/app.js"]

# Frontend production stage
FROM nginx:alpine AS webapp-prod
COPY --from=webapp-build /app/webapp/dist /usr/share/nginx/html
# Add nginx configuration for SPA routing
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
