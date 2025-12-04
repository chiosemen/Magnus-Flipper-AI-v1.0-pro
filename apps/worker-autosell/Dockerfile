# Worker Autosell Dockerfile
# NO-BUILD strategy: Copy pre-built dist files only
# Build from repo root: docker build -f apps/worker-autosell/Dockerfile .

FROM node:20-alpine

WORKDIR /app

# Copy root workspace files first (for pnpm workspace resolution)
COPY package.json ./package.json
COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./

# Copy worker dist and package.json (maintain workspace structure)
COPY apps/worker-autosell/dist ./apps/worker-autosell/dist
COPY apps/worker-autosell/package.json ./apps/worker-autosell/package.json

# Copy required workspace package dists (for workspace: dependencies)
COPY packages/profit-engine/dist ./packages/profit-engine/dist
COPY packages/profit-engine/package.json ./packages/profit-engine/package.json

# Install only production dependencies
RUN corepack enable && corepack prepare pnpm@latest --activate && \
    pnpm install --prod --frozen-lockfile

# Set working directory to worker for runtime
WORKDIR /app/apps/worker-autosell

# Expose port for health checks
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1) })" || exit 1

# Run worker
ENV NODE_ENV=production
CMD ["node", "dist/autosell/index.js"]

