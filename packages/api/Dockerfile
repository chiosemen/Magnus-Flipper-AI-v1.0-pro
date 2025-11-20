# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build TypeScript (if you add a build script later)
# RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm install --production

# Copy source code from builder
COPY --from=builder /app/src ./src
COPY --from=builder /app/tsconfig.json ./

# Install ts-node for runtime (since you're using --esm)
RUN npm install ts-node typescript

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); })"

# Set environment
ENV NODE_ENV=production
ENV PORT=4000

# Start the server
CMD ["npm", "run", "dev"]
