# apps/worker-alerts/Dockerfile
# Multi-stage build for production-ready alerts worker

FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

# Copy dependency manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./

# Copy package.json files
COPY apps/worker-alerts/package.json ./apps/worker-alerts/
COPY apps/api/package.json ./apps/api/
COPY apps/scheduler/package.json ./apps/scheduler/
COPY apps/worker-crawler/package.json ./apps/worker-crawler/
COPY apps/worker-analyzer/package.json ./apps/worker-analyzer/
COPY apps/bot-telegram/package.json ./apps/bot-telegram/
COPY packages/core/package.json ./packages/core/
COPY packages/queue/package.json ./packages/queue/
COPY packages/shared/package.json ./packages/shared/
COPY packages/notifications/package.json ./packages/notifications/
COPY packages/fb-marketplace-crawler/package.json ./packages/fb-marketplace-crawler/

# Install dependencies
RUN pnpm install --filter worker-alerts... --frozen-lockfile

# Copy source code
COPY apps/worker-alerts ./apps/worker-alerts
COPY packages ./packages

# Build
RUN pnpm --filter worker-alerts... build

# -------- Runtime Stage --------
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN apk add --no-cache dumb-init
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

# Copy workspace config
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy built worker
COPY --from=builder /app/apps/worker-alerts/dist ./apps/worker-alerts/dist
COPY --from=builder /app/apps/worker-alerts/package.json ./apps/worker-alerts/package.json

# Copy workspace dependencies (includes notifications)
COPY --from=builder /app/packages/core ./packages/core
COPY --from=builder /app/packages/queue ./packages/queue
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/packages/notifications ./packages/notifications

# Install production dependencies only
RUN pnpm install --filter worker-alerts... --prod --frozen-lockfile

# Security: non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# Health check
HEALTHCHECK --interval=60s --timeout=5s --start-period=20s --retries=3 \
  CMD pgrep -f "node.*worker-alerts" > /dev/null || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "apps/worker-alerts/dist/index.js"]

LABEL org.opencontainers.image.title="Magnus Flipper AI - Alerts Worker"
LABEL org.opencontainers.image.description="BullMQ worker for sending alerts"
LABEL org.opencontainers.image.version="1.0.0"
