# apps/api/Dockerfile
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
COPY --from=builder /app/apps/api ./apps/api

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Security: non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

EXPOSE 4000

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "apps/api/dist/index.js"]

LABEL org.opencontainers.image.title="Magnus Flipper AI - API"
LABEL org.opencontainers.image.description="REST API for Magnus Flipper AI"
LABEL org.opencontainers.image.version="1.0.0"
