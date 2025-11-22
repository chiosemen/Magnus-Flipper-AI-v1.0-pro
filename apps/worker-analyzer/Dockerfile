# apps/worker-analyzer/Dockerfile
# Multi-stage build for production-ready analyzer worker

FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# Copy dependency manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./

# Copy package.json files
COPY apps/worker-analyzer/package.json ./apps/worker-analyzer/
COPY apps/api/package.json ./apps/api/
COPY apps/scheduler/package.json ./apps/scheduler/
COPY apps/worker-crawler/package.json ./apps/worker-crawler/
COPY apps/worker-alerts/package.json ./apps/worker-alerts/
COPY apps/bot-telegram/package.json ./apps/bot-telegram/
COPY packages/*/package.json ./packages/

# Install dependencies
RUN pnpm install --filter worker-analyzer... --frozen-lockfile

# Copy source code
COPY apps/worker-analyzer ./apps/worker-analyzer
COPY packages ./packages

# Build
RUN pnpm --filter worker-analyzer... build

# -------- Runtime Stage --------
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN apk add --no-cache dumb-init
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# Copy workspace config
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy built worker
COPY --from=builder /app/apps/worker-analyzer/dist ./apps/worker-analyzer/dist
COPY --from=builder /app/apps/worker-analyzer/package.json ./apps/worker-analyzer/package.json

# Copy workspace dependencies
COPY --from=builder /app/packages/core ./packages/core
COPY --from=builder /app/packages/queue ./packages/queue
COPY --from=builder /app/packages/shared ./packages/shared

# Install production dependencies only
RUN pnpm install --filter worker-analyzer... --prod --frozen-lockfile

# Security: non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# Health check
HEALTHCHECK --interval=60s --timeout=5s --start-period=20s --retries=3 \
  CMD pgrep -f "node.*worker-analyzer" > /dev/null || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "apps/worker-analyzer/dist/index.js"]

LABEL org.opencontainers.image.title="Magnus Flipper AI - Analyzer Worker"
LABEL org.opencontainers.image.description="BullMQ worker for analyzing listings"
LABEL org.opencontainers.image.version="1.0.0"
