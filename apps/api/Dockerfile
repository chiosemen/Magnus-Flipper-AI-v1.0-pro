# apps/api/Dockerfile
# Multi-stage build for production-ready API service

FROM node:20-alpine AS builder

WORKDIR /app

# Enable pnpm via corepack
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# Copy dependency manifests first (better layer caching)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./

# Copy package.json files for workspace dependency resolution
COPY apps/api/package.json ./apps/api/
COPY apps/scheduler/package.json ./apps/scheduler/
COPY apps/worker-crawler/package.json ./apps/worker-crawler/
COPY apps/worker-analyzer/package.json ./apps/worker-analyzer/
COPY apps/worker-alerts/package.json ./apps/worker-alerts/
COPY apps/bot-telegram/package.json ./apps/bot-telegram/
COPY packages/*/package.json ./packages/

# Install dependencies (cached layer if package.json unchanged)
RUN pnpm install --filter api... --frozen-lockfile

# Copy source code (separate layer - changes frequently)
COPY apps/api ./apps/api
COPY packages ./packages

# Build API and its workspace dependencies
RUN pnpm --filter api... build

# -------- Runtime Stage --------
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Enable pnpm for runtime
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# Copy root workspace config
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy built API service
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json

# Copy workspace packages that API depends on (with their built artifacts)
COPY --from=builder /app/packages/core ./packages/core
COPY --from=builder /app/packages/queue ./packages/queue
COPY --from=builder /app/packages/shared ./packages/shared

# Install ONLY production dependencies for API
RUN pnpm install --filter api... --prod --frozen-lockfile

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

EXPOSE 4000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "apps/api/dist/index.js"]

# Metadata
LABEL org.opencontainers.image.title="Magnus Flipper AI - API"
LABEL org.opencontainers.image.description="REST API for Magnus Flipper AI"
LABEL org.opencontainers.image.version="1.0.0"
