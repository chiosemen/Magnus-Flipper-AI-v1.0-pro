# apps/bot-telegram/Dockerfile
# Multi-stage build for production-ready Telegram bot

FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# Copy dependency manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./

# Copy package.json files
COPY apps/bot-telegram/package.json ./apps/bot-telegram/
COPY apps/api/package.json ./apps/api/
COPY apps/scheduler/package.json ./apps/scheduler/
COPY apps/worker-crawler/package.json ./apps/worker-crawler/
COPY apps/worker-analyzer/package.json ./apps/worker-analyzer/
COPY apps/worker-alerts/package.json ./apps/worker-alerts/
COPY packages/*/package.json ./packages/

# Install dependencies
RUN pnpm install --filter bot-telegram... --frozen-lockfile

# Copy source code
COPY apps/bot-telegram ./apps/bot-telegram
COPY packages ./packages

# Build
RUN pnpm --filter bot-telegram... build

# -------- Runtime Stage --------
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN apk add --no-cache dumb-init
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# Copy workspace config
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy built bot
COPY --from=builder /app/apps/bot-telegram/dist ./apps/bot-telegram/dist
COPY --from=builder /app/apps/bot-telegram/package.json ./apps/bot-telegram/package.json

# Copy workspace dependencies
COPY --from=builder /app/packages/core ./packages/core
COPY --from=builder /app/packages/queue ./packages/queue
COPY --from=builder /app/packages/shared ./packages/shared

# Install production dependencies only
RUN pnpm install --filter bot-telegram... --prod --frozen-lockfile

# Security: non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# Health check (Telegram bot doesn't expose HTTP port)
HEALTHCHECK --interval=60s --timeout=5s --start-period=20s --retries=3 \
  CMD pgrep -f "node.*bot-telegram" > /dev/null || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "apps/bot-telegram/dist/index.js"]

LABEL org.opencontainers.image.title="Magnus Flipper AI - Telegram Bot"
LABEL org.opencontainers.image.description="Telegram bot interface for Magnus Flipper AI"
LABEL org.opencontainers.image.version="1.0.0"
