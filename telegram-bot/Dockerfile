FROM node:23-alpine

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Set working directory
WORKDIR /app

# Copy package.json and pnpm-lock.yaml first
COPY package.json pnpm-lock.yaml ./

# Copy source code
COPY . .

# Set default environment
ENV NODE_ENV=development

# Create entrypoint script that installs dependencies and starts the app
RUN echo '#!/bin/sh' > /entrypoint.sh && \
    echo 'cd /app' >> /entrypoint.sh && \
    echo 'echo "Installing dependencies..."' >> /entrypoint.sh && \
    echo 'pnpm install --force' >> /entrypoint.sh && \
    echo 'echo "Starting application..."' >> /entrypoint.sh && \
    echo 'exec "$@"' >> /entrypoint.sh && \
    chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
CMD ["pnpm", "run", "dev"]
