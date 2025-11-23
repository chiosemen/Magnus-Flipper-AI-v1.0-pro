# apps/web/Dockerfile
# PNPM Monorepo-aware multi-stage build for Next.js

FROM node:20-alpine AS builder

WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

# Copy entire monorepo (ensures all workspace packages are available)
COPY . .

# Install all dependencies with frozen lockfile
RUN pnpm install --frozen-lockfile

# Build all workspace packages recursively (including SDK and web app)
RUN pnpm -r build

# -------- Runtime Stage --------
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Install runtime dependencies
RUN apk add --no-cache dumb-init

# Security: non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy workspace configuration
COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./

# Copy Next.js standalone output (includes all dependencies)
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "apps/web/server.js"]

LABEL org.opencontainers.image.title="Magnus Flipper AI - Web"
LABEL org.opencontainers.image.description="Next.js frontend for Magnus Flipper AI"
LABEL org.opencontainers.image.version="1.0.0"
