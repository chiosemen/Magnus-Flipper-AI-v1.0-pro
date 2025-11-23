# apps/worker-alerts/Dockerfile
# PNPM Monorepo-aware multi-stage build

FROM node:20-alpine AS builder

WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

# Copy entire monorepo (ensures all workspace packages are available)
COPY . .

# Install all dependencies with frozen lockfile
RUN pnpm install --frozen-lockfile

# Build all workspace packages recursively
RUN pnpm -r build

# -------- Runtime Stage --------
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Install runtime dependencies
RUN apk add --no-cache dumb-init
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

# Copy workspace configuration
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy all built packages and apps from builder
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/worker-alerts ./apps/worker-alerts

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

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
