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

# Install dependencies WITHOUT running prisma generate yet
RUN pnpm install --frozen-lockfile --ignore-scripts

# Now copy the source code including prisma schema
COPY . .

# Generate Prisma client
RUN cd backend && pnpm prisma generate

# Backend development stage
FROM base AS backend-dev
WORKDIR /app
EXPOSE 3001
CMD ["pnpm", "--filter", "@visarun/backend", "run", "dev"]

# webapp development stage
FROM base AS webapp-dev
WORKDIR /app
EXPOSE 5173
# Configure Vite to listen on all interfaces and use proper host
CMD ["pnpm", "--filter", "@visarun/webapp", "run", "dev", "--", "--host", "0.0.0.0"]

# Backend build stage
FROM base AS backend-build
WORKDIR /app/backend
# Make sure the build script creates the dist directory correctly
RUN mkdir -p dist && echo "console.log('Backend app is running');" > dist/main.js
# Replace the line above with your actual build command once available:
# RUN pnpm run build

# Frontend build stage
FROM base AS webapp-build
WORKDIR /app
# Set production environment variables if needed
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
RUN pnpm --filter @visarun/webapp run build

# Backend production stage
FROM node:23-alpine AS backend-prod
WORKDIR /app
ENV NODE_ENV=production

# Install pnpm in the production container
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy backend files to production
COPY --from=backend-build /app/backend/package.json ./
COPY --from=backend-build /app/backend/prisma ./prisma
COPY --from=backend-build /app/backend/dist ./dist

# Temporarily remove the prepare script from package.json to avoid the circular dependency
RUN sed -i 's/"prepare": "pnpm pgc",/"prepare": "",/g' package.json

# Install dependencies with approved builds
RUN pnpm install
RUN pnpm rebuild # Force rebuild of native modules
RUN pnpm approve-builds @prisma/client prisma bcrypt esbuild @prisma/engines

# Generate Prisma client directly using npx
ENV DATABASE_URL="postgresql://postgres:postgres@postgres:5432/visarun"
RUN npx prisma generate

# Keep only production dependencies
RUN pnpm install --prod

EXPOSE 3001
CMD ["node", "dist/main.js"]

# Frontend production stage
FROM nginx:alpine AS webapp-prod
COPY --from=webapp-build /app/webapp/dist /usr/share/nginx/html
# Add nginx configuration for SPA routing
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
