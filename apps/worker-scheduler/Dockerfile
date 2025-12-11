# Worker Scheduler Dockerfile
# Build from repo root: docker build -f apps/worker-scheduler/Dockerfile .
# Uses multi-stage build with pnpm workspace support

FROM node:20-slim AS builder

WORKDIR /app

# -------------------------------------------------------
# Prisma fix for Debian (system dependencies)
# -------------------------------------------------------
RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    curl \
  && rm -rf /var/lib/apt/lists/*
ENV PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1
# -------------------------------------------------------

# Copy root workspace files (for pnpm workspace resolution)
COPY package.json ./package.json
COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./

# Copy worker-scheduler source and package.json
COPY apps/worker-scheduler/package.json ./apps/worker-scheduler/package.json
COPY apps/worker-scheduler/tsconfig.json ./apps/worker-scheduler/tsconfig.json
COPY apps/worker-scheduler/src ./apps/worker-scheduler/src

# Copy required workspace packages
COPY packages/core/package.json ./packages/core/package.json
COPY packages/core/tsconfig.json ./packages/core/tsconfig.json
COPY packages/core/src ./packages/core/src
COPY packages/core/prisma ./packages/core/prisma

COPY packages/rate-limiter/package.json ./packages/rate-limiter/package.json
COPY packages/rate-limiter/tsconfig.json ./packages/rate-limiter/tsconfig.json
COPY packages/rate-limiter/src ./packages/rate-limiter/src

COPY packages/marketplace-config/package.json ./packages/marketplace-config/package.json
COPY packages/marketplace-config/tsconfig.json ./packages/marketplace-config/tsconfig.json
COPY packages/marketplace-config/src ./packages/marketplace-config/src

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Install all dependencies (including dev for build)
RUN pnpm install --no-frozen-lockfile --ignore-scripts

# Generate Prisma client explicitly
RUN pnpm --filter @magnus-flipper-ai/core exec -- prisma generate --schema=./prisma/schema.prisma

# Build packages
RUN pnpm --filter @magnus-flipper-ai/core build
RUN pnpm --filter @magnus-flipper-ai/rate-limiter build
RUN pnpm --filter @magnus-flipper-ai/marketplace-config build

# Build worker-scheduler
RUN pnpm --filter @magnus-flipper-ai/worker-scheduler build

# Production stage
FROM node:20-slim

WORKDIR /app

# Copy root workspace files
COPY package.json ./package.json
COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./

# Copy built worker-scheduler dist from builder stage
COPY --from=builder /app/apps/worker-scheduler/dist ./apps/worker-scheduler/dist
COPY --from=builder /app/apps/worker-scheduler/package.json ./apps/worker-scheduler/package.json

# Copy built workspace package dists from builder stage
COPY --from=builder /app/packages/core/dist ./packages/core/dist
COPY --from=builder /app/packages/core/package.json ./packages/core/package.json
COPY --from=builder /app/packages/core/prisma ./packages/core/prisma

COPY --from=builder /app/packages/rate-limiter/dist ./packages/rate-limiter/dist
COPY --from=builder /app/packages/rate-limiter/package.json ./packages/rate-limiter/package.json

COPY --from=builder /app/packages/marketplace-config/dist ./packages/marketplace-config/dist
COPY --from=builder /app/packages/marketplace-config/package.json ./packages/marketplace-config/package.json

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Install only production dependencies
RUN pnpm install --prod --frozen-lockfile

# Set working directory to worker for runtime
WORKDIR /app/apps/worker-scheduler

# Expose port for health checks
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1) })" || exit 1

# Run worker
ENV NODE_ENV=production
CMD ["node", "dist/index.js"]
