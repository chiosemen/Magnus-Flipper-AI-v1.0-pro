FROM node:20-slim
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app
COPY package*.json ./
COPY tsconfig.json ./
COPY src ./src
RUN pnpm install --prod
RUN pnpm build
CMD ["pnpm", "start"]
