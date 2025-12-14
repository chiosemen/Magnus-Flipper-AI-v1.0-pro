FROM node:20-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy package files
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY package.json ./
COPY packages/scraper-sync/package.json ./packages/scraper-sync/
COPY apps/worker-ingestion/package.json ./apps/worker-ingestion/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/scraper-sync ./packages/scraper-sync
COPY apps/worker-ingestion ./apps/worker-ingestion

# Build
WORKDIR /app/apps/worker-ingestion
RUN pnpm build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY package.json ./
COPY packages/scraper-sync/package.json ./packages/scraper-sync/
COPY apps/worker-ingestion/package.json ./apps/worker-ingestion/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built files
COPY --from=base /app/packages/scraper-sync ./packages/scraper-sync
COPY --from=base /app/apps/worker-ingestion/dist ./apps/worker-ingestion/dist
COPY --from=base /app/apps/worker-ingestion/package.json ./apps/worker-ingestion/

WORKDIR /app/apps/worker-ingestion

EXPOSE 3001

CMD ["node", "dist/index.js"]
