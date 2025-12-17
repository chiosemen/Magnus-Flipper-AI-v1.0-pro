FROM node:20-slim

WORKDIR /app

RUN corepack enable

# Workspace manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json turbo.json ./

# Full workspace (needed for install/build)
COPY packages ./packages
COPY apps ./apps

# Install deps, generate Prisma client, and build worker inside the image
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @magnus-flipper-ai/core prisma generate
RUN pnpm --filter magnus-worker build

CMD ["node", "apps/worker/dist/index.js"]
