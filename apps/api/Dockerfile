# 1. Base image
FROM node:20-alpine

# 2. Set working directory inside container
WORKDIR /app

# 3. Copy root package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./

# 4. Install pnpm
RUN npm install -g pnpm@9

# 5. Copy whole monorepo
COPY . .

# 6. Install dependencies
RUN pnpm install --frozen-lockfile

# 7. Build all packages and apps
RUN pnpm build

# 8. Expose API port
EXPOSE 10000

# 9. Start API
CMD ["pnpm", "start:api"]
