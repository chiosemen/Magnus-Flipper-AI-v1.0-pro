# PR #1: worker-alerts Dockerfile + TypeScript Fixes

## Objective
Add missing Dockerfile for worker-alerts and fix TypeScript build errors.

## Files Changed

### 1. `apps/worker-alerts/Dockerfile` (NEW)

```dockerfile
# Worker Alerts Dockerfile
# Build from repo root: docker build -f apps/worker-alerts/Dockerfile .
# Uses multi-stage build with pnpm workspace support

FROM node:20-slim AS builder

WORKDIR /app

# -------------------------------------------------------
# Prisma fix for Debian (system dependencies)
# -------------------------------------------------------
RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    curl \
  && rm -rf /var/lib/apt/lists/*
ENV PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1
# -------------------------------------------------------

# Copy root workspace files (for pnpm workspace resolution)
COPY package.json ./package.json
COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./

# Copy worker-alerts source and package.json
COPY apps/worker-alerts/package.json ./apps/worker-alerts/package.json
COPY apps/worker-alerts/tsconfig.json ./apps/worker-alerts/tsconfig.json
COPY apps/worker-alerts/src ./apps/worker-alerts/src

# Copy required workspace packages
COPY packages/core/package.json ./packages/core/package.json
COPY packages/core/tsconfig.json ./packages/core/tsconfig.json
COPY packages/core/src ./packages/core/src
COPY packages/core/prisma ./packages/core/prisma

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Install all dependencies (including dev for build)
RUN pnpm install --no-frozen-lockfile --ignore-scripts

# Generate Prisma client explicitly
RUN pnpm --filter @magnus-flipper-ai/core exec -- prisma generate --schema=./prisma/schema.prisma

# Build packages
RUN pnpm --filter @magnus-flipper-ai/core build

# Build worker-alerts
RUN pnpm --filter @magnus-flipper-ai/worker-alerts build

# Production stage
FROM node:20-slim

WORKDIR /app

# Copy root workspace files
COPY package.json ./package.json
COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./

# Copy built worker-alerts dist from builder stage
COPY --from=builder /app/apps/worker-alerts/dist ./apps/worker-alerts/dist
COPY --from=builder /app/apps/worker-alerts/package.json ./apps/worker-alerts/package.json

# Copy built workspace package dists from builder stage
COPY --from=builder /app/packages/core/dist ./packages/core/dist
COPY --from=builder /app/packages/core/package.json ./packages/core/package.json
COPY --from=builder /app/packages/core/prisma ./packages/core/prisma

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Install only production dependencies
RUN pnpm install --prod --frozen-lockfile

# Set working directory to worker for runtime
WORKDIR /app/apps/worker-alerts

# Expose port for health checks
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1) })" || exit 1

# Run worker
ENV NODE_ENV=production
CMD ["node", "dist/index.js"]
```

### 2. `apps/worker-alerts/src/mlClient.ts`

**Line 133-134:**
```diff
-    const data = await response.json();
-    const content = data.choices?.[0]?.message?.content;
+    const data = await response.json() as {
+      choices?: Array<{ message?: { content?: string } }>;
+    };
+    const content = data.choices?.[0]?.message?.content;
```

**Line 212-213:**
```diff
-    const data = await response.json();
-    const content = data.choices?.[0]?.message?.content;
+    const data = await response.json() as {
+      choices?: Array<{ message?: { content?: string } }>;
+    };
+    const content = data.choices?.[0]?.message?.content;
```

### 3. `apps/worker-alerts/src/services/prisma.ts`

```diff
-// Re-export prisma from core package for consistency
-export { prisma } from "@magnus-flipper-ai/core/db";
+// Re-export prisma from core package for consistency
+import { prisma } from "@magnus-flipper-ai/core";
+export { prisma };
```

## Validation Steps

1. **TypeScript Build**:
   ```bash
   pnpm --filter @magnus-flipper-ai/worker-alerts build
   ```
   Expected: ✅ No errors

2. **Docker Build** (local test):
   ```bash
   docker build -f apps/worker-alerts/Dockerfile -t magnus-worker-alerts:test .
   ```
   Expected: ✅ Build succeeds

3. **CI Verification**:
   - PR must pass `ci-invariant.yml` workflow
   - No DeployGuardian validation (still disabled)

## Risk Assessment

- **Risk Level**: LOW
- **Impact if Fails**: worker-alerts won't deploy via Docker
- **Rollback**: Revert PR, Dockerfile is optional for now

## Notes

- Dockerfile matches pattern from worker-scheduler
- Type assertions are minimal and safe
- Import path fix aligns with core package exports

