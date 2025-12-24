FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY apps/worker-operator/package.json ./apps/worker-operator/
COPY packages/operator-agent/package.json ./packages/operator-agent/
COPY packages/operator-kb/package.json ./packages/operator-kb/

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY apps/worker-operator ./apps/worker-operator
COPY packages/operator-agent ./packages/operator-agent
COPY packages/operator-kb ./packages/operator-kb
COPY tsconfig.base.json ./

# Build
WORKDIR /app/apps/worker-operator
RUN pnpm build

# Run
CMD ["node", "dist/index.js"]

