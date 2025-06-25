FROM node:23-alpine

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Set working directory
WORKDIR /app

# Copy package.json first
COPY package.json ./

# Install dependencies
RUN pnpm install --no-frozen-lockfile

# Copy source code
COPY . .

# Set default environment
ENV NODE_ENV=development

# Start the application
CMD ["pnpm", "run", "dev"]
