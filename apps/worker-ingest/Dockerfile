# Worker Ingest Dockerfile
# Build from repo root: docker build -f apps/worker-ingest/Dockerfile .
# Uses monorepo-in-container pattern

FROM node:22-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    curl \
  && rm -rf /var/lib/apt/lists/*

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate

# Copy entire monorepo root (for workspace resolution)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy worker-ingest app
COPY apps/worker-ingest ./apps/worker-ingest

# Copy required workspace packages
COPY packages/queue ./packages/queue
COPY packages/scrapers ./packages/scrapers

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build only worker-ingest
RUN pnpm --filter worker-ingest build

# Set working directory to worker for runtime
WORKDIR /app/apps/worker-ingest

# Run worker
ENV NODE_ENV=production
CMD ["pnpm", "--filter", "worker-ingest", "start"]
