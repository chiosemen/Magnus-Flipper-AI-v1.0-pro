FROM node:20-slim

WORKDIR /app

# Enable corepack for pnpm
RUN corepack enable

# Copy workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
COPY apps/worker-alerts ./apps/worker-alerts

# Install dependencies
RUN pnpm -w install --frozen-lockfile

# Build workspace packages first
RUN pnpm build:packages

# Build worker-alerts
RUN pnpm --filter worker-alerts build

# Runtime
WORKDIR /app/apps/worker-alerts
CMD ["node", "dist/index.js"]

