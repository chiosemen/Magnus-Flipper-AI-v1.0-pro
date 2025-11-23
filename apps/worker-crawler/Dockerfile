# apps/worker-crawler/Dockerfile
# Multi-stage build for production-ready crawler worker

FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

# Copy dependency manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./

# Copy package.json files
COPY apps/worker-crawler/package.json ./apps/worker-crawler/
COPY apps/api/package.json ./apps/api/
COPY apps/scheduler/package.json ./apps/scheduler/
COPY apps/worker-analyzer/package.json ./apps/worker-analyzer/
COPY apps/worker-alerts/package.json ./apps/worker-alerts/
COPY packages/core/package.json ./packages/core/
COPY packages/queue/package.json ./packages/queue/
COPY packages/shared/package.json ./packages/shared/
COPY packages/notifications/package.json ./packages/notifications/
COPY packages/fb-marketplace-crawler/package.json ./packages/fb-marketplace-crawler/

# Install dependencies
RUN pnpm install --filter worker-crawler... --frozen-lockfile

# Copy source code
COPY apps/worker-crawler ./apps/worker-crawler
COPY packages ./packages

# Build
RUN pnpm --filter worker-crawler... build

# -------- Runtime Stage --------
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Install system dependencies for Puppeteer
RUN apk add --no-cache \
    dumb-init \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Tell Puppeteer to use installed chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

# Copy workspace config
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy built worker
COPY --from=builder /app/apps/worker-crawler/dist ./apps/worker-crawler/dist
COPY --from=builder /app/apps/worker-crawler/package.json ./apps/worker-crawler/package.json

# Copy workspace dependencies (includes fb-marketplace-crawler)
COPY --from=builder /app/packages/core ./packages/core
COPY --from=builder /app/packages/queue ./packages/queue
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/packages/fb-marketplace-crawler ./packages/fb-marketplace-crawler

# Install production dependencies only
RUN pnpm install --filter worker-crawler... --prod --frozen-lockfile

# Security: non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# Health check (BullMQ worker process check)
HEALTHCHECK --interval=60s --timeout=5s --start-period=20s --retries=3 \
  CMD pgrep -f "node.*worker-crawler" > /dev/null || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "apps/worker-crawler/dist/index.js"]

LABEL org.opencontainers.image.title="Magnus Flipper AI - Crawler Worker"
LABEL org.opencontainers.image.description="BullMQ worker for crawling marketplace listings"
LABEL org.opencontainers.image.version="1.0.0"
