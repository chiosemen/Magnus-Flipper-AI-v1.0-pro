# Worker Ingest Dockerfile
# Build from repo root: docker build -f apps/worker-ingest/Dockerfile .
# Uses monorepo-in-container pattern

FROM node:22-slim

WORKDIR /app

# Install system dependencies (including Playwright browser dependencies)
RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    curl \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libdbus-1-3 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
  && rm -rf /var/lib/apt/lists/*

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate

# Copy entire monorepo root (for workspace resolution)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./

# Copy worker-ingest app
COPY apps/worker-ingest ./apps/worker-ingest

# Copy required workspace packages (all dependencies of worker-ingest)
# These packages are required at build time for TypeScript resolution
COPY packages/queue ./packages/queue
COPY packages/scrapers ./packages/scrapers
COPY packages/ingest-registry ./packages/ingest-registry
COPY packages/apify-adapter ./packages/apify-adapter

# Install dependencies
RUN pnpm install --frozen-lockfile

# Install Playwright Chromium browser (required for scrapers fallback)
# Playwright is installed in @magnus-flipper-ai/scrapers package
# Note: Must run from workspace root to resolve pnpm workspace correctly
RUN pnpm --filter @magnus-flipper-ai/scrapers exec playwright install chromium
RUN pnpm --filter @magnus-flipper-ai/scrapers exec playwright install-deps chromium

# Build only worker-ingest
RUN pnpm --filter worker-ingest build

# Set working directory to worker for runtime
WORKDIR /app/apps/worker-ingest

# Run worker
ENV NODE_ENV=production
CMD ["pnpm", "--filter", "worker-ingest", "start"]
