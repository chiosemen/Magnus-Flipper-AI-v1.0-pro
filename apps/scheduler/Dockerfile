# apps/scheduler/Dockerfile
# Multi-stage build for production-ready scheduler service

FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# Copy dependency manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./

# Copy package.json files for workspace resolution
COPY apps/scheduler/package.json ./apps/scheduler/
COPY apps/api/package.json ./apps/api/
COPY apps/worker-crawler/package.json ./apps/worker-crawler/
COPY apps/worker-analyzer/package.json ./apps/worker-analyzer/
COPY apps/worker-alerts/package.json ./apps/worker-alerts/
COPY apps/bot-telegram/package.json ./apps/bot-telegram/
COPY packages/*/package.json ./packages/

# Install dependencies
RUN pnpm install --filter scheduler... --frozen-lockfile

# Copy source code
COPY apps/scheduler ./apps/scheduler
COPY packages ./packages

# Build scheduler and dependencies
RUN pnpm --filter scheduler... build

# -------- Runtime Stage --------
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN apk add --no-cache dumb-init
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# Copy workspace config
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy built scheduler
COPY --from=builder /app/apps/scheduler/dist ./apps/scheduler/dist
COPY --from=builder /app/apps/scheduler/package.json ./apps/scheduler/package.json

# Copy workspace dependencies
COPY --from=builder /app/packages/core ./packages/core
COPY --from=builder /app/packages/queue ./packages/queue
COPY --from=builder /app/packages/shared ./packages/shared

# Install production dependencies only
RUN pnpm install --filter scheduler... --prod --frozen-lockfile

# Security: non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# Health check (scheduler may not have HTTP endpoint - remove if not applicable)
HEALTHCHECK --interval=60s --timeout=5s --start-period=20s --retries=3 \
  CMD pgrep -f "node.*scheduler" > /dev/null || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "apps/scheduler/dist/index.js"]

LABEL org.opencontainers.image.title="Magnus Flipper AI - Scheduler"
LABEL org.opencontainers.image.description="Cron scheduler for Magnus Flipper AI"
LABEL org.opencontainers.image.version="1.0.0"
