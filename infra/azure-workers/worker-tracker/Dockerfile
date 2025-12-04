# Worker Tracker Dockerfile
# Builds the worker-tracker Azure Container App

FROM node:20-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/worker-tracker/package.json ./apps/worker-tracker/
COPY packages/*/package.json ./packages/*/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source files
COPY apps/worker-tracker ./apps/worker-tracker
COPY packages ./packages

# Build worker
WORKDIR /app/apps/worker-tracker
RUN pnpm build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/worker-tracker/package.json ./apps/worker-tracker/
COPY packages/*/package.json ./packages/*/

# Install production dependencies only
RUN corepack enable && corepack prepare pnpm@latest --activate && \
    pnpm install --frozen-lockfile --prod

# Copy built files
COPY --from=base /app/apps/worker-tracker/dist ./apps/worker-tracker/dist
COPY --from=base /app/packages ./packages

# Set working directory
WORKDIR /app/apps/worker-tracker

# Expose port (if needed for health checks)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1) })" || exit 1

# Run worker
CMD ["node", "dist/tracker/index.js"]

