FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN corepack enable

# Copy only necessary files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/worker-crawler ./apps/worker-crawler
COPY packages ./packages

RUN pnpm install --filter @magnus-flipper-ai/worker-crawler...

ENV NODE_ENV=production

CMD ["pnpm", "start", "--filter", "@magnus-flipper-ai/worker-crawler"]
