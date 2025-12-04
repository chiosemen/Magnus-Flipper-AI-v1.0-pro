# Worker Deployment v2 Report
**Date:** 2025-12-04  
**Status:** Dockerfiles Fixed, Images Built & Pushed, Container Apps Updated

## Summary

Successfully repaired all worker Dockerfiles, built linux/amd64 images, pushed to ACR, and updated Azure Container Apps. All workers are now running v2 images, but there is a **runtime module resolution issue** that needs to be addressed.

---

## ✅ Completed Tasks

### 1. Dockerfile Simplification (NO-BUILD Pattern)

All three worker Dockerfiles were simplified to use a minimal NO-BUILD pattern:

**Files Modified:**
- `apps/worker-scraper/Dockerfile`
- `apps/worker-tracker/Dockerfile`
- `apps/worker-autosell/Dockerfile`

**Key Changes:**
- Changed base image from `node:20-slim` to `node:20-alpine` (smaller)
- Removed TypeScript build steps (assumes pre-built dist)
- Maintained workspace structure for pnpm dependency resolution
- Copy only dist files, package.json, and workspace config files
- Install production dependencies only

**Final Dockerfile Pattern:**
```dockerfile
FROM node:20-alpine
WORKDIR /app

# Copy root workspace files first
COPY package.json ./package.json
COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./

# Copy worker dist and package.json (maintain workspace structure)
COPY apps/worker-{name}/dist ./apps/worker-{name}/dist
COPY apps/worker-{name}/package.json ./apps/worker-{name}/package.json

# Copy required workspace package dists
COPY packages/{package-name}/dist ./packages/{package-name}/dist
COPY packages/{package-name}/package.json ./packages/{package-name}/package.json

# Install only production dependencies
RUN corepack enable && corepack prepare pnpm@latest --activate && \
    pnpm install --prod --frozen-lockfile

WORKDIR /app/apps/worker-{name}
CMD ["node", "dist/{name}/index.js"]
```

### 2. TypeScript Builds

All workers and their dependent packages were built successfully:
- ✅ `worker-scraper` → dist built
- ✅ `worker-tracker` → dist built
- ✅ `worker-autosell` → dist built
- ✅ `scraper-sync` → dist built
- ✅ `shipping-engine` → dist built
- ✅ `profit-engine` → dist built

### 3. Docker Image Builds (linux/amd64)

All images built successfully with v2 tags:
- ✅ `worker-scraper:v2` (linux/amd64)
- ✅ `worker-tracker:v2` (linux/amd64)
- ✅ `worker-autosell:v2` (linux/amd64)

**Build Command:**
```bash
docker build --platform linux/amd64 -t worker-{name}:v2 -f apps/worker-{name}/Dockerfile .
```

### 4. ACR Push

Images tagged and pushed to Azure Container Registry:
- ✅ `magnusacr.azurecr.io/worker-scraper:v2`
- ✅ `magnusacr.azurecr.io/worker-tracker:v2`
- ✅ `magnusacr.azurecr.io/worker-autosell:v2`

### 5. Azure Container Apps Updated

All three Container Apps successfully updated to use v2 images:

| App Name | Status | Running Status | Image |
|----------|--------|----------------|-------|
| worker-scraper | Succeeded | Running | magnusacr.azurecr.io/worker-scraper:v2 |
| worker-tracker | Succeeded | Running | magnusacr.azurecr.io/worker-tracker:v2 |
| worker-autosell | Succeeded | Running | magnusacr.azurecr.io/worker-autosell:v2 |

**Update Command:**
```bash
az containerapp update \
  --name worker-{name} \
  --resource-group magnus-rg \
  --image magnusacr.azurecr.io/worker-{name}:v2
```

---

## ⚠️ Remaining Issue: ESM Module Resolution

### Problem

All three workers are failing at runtime with `ERR_MODULE_NOT_FOUND` errors due to missing `.js` extensions in ESM imports.

**Error Examples:**
- `worker-scraper`: Cannot find module `/app/packages/scraper-sync/dist/scrapers/facebookMarketplace`
- `worker-tracker`: Cannot find module `/app/packages/shipping-engine/dist/carrier/carrierClient_USPS`
- `worker-autosell`: Cannot find module `/app/packages/profit-engine/dist/autosell/crossPlatformLock`

### Root Cause

The TypeScript compiler outputs ESM code (due to `"module": "ESNext"` in tsconfig), but:
1. TypeScript doesn't automatically add `.js` extensions to relative imports
2. Node.js ESM requires `.js` extensions for relative imports
3. Worker package.json files have `"type": "module"`, forcing ESM mode

### Solution Options

**Option 1: Add `.js` Extensions to Source Imports (Recommended)**
- Update all import statements in source files to include `.js` extensions
- Example: `import { X } from "../scrapers/facebookMarketplace"` → `import { X } from "../scrapers/facebookMarketplace.js"`
- Files affected:
  - `packages/scraper-sync/**/*.ts`
  - `packages/shipping-engine/**/*.ts`
  - `packages/profit-engine/**/*.ts`

**Option 2: Switch to CommonJS**
- Change `"type": "module"` to removed/omitted in worker package.json files
- Change tsconfig `"module"` from `"ESNext"` to `"CommonJS"`
- Rebuild all packages and workers

**Option 3: Use Post-Build Script**
- Add a post-build script that rewrites imports to add `.js` extensions
- More complex but doesn't require source changes

### Recommended Next Steps

1. **Immediate Fix:** Add `.js` extensions to all relative imports in:
   - `packages/scraper-sync/orchestrator/scraperOrchestrator.ts`
   - `packages/shipping-engine/tracking/trackingManager.ts`
   - `packages/profit-engine/autosell/finalizeSale.ts`
   - And any other files with relative imports

2. **Rebuild:** After fixing imports, rebuild all packages:
   ```bash
   pnpm --filter scraper-sync build
   pnpm --filter shipping-engine build
   pnpm --filter profit-engine build
   pnpm --filter worker-scraper build
   pnpm --filter worker-tracker build
   pnpm --filter worker-autosell build
   ```

3. **Rebuild Docker Images:** Rebuild and push v3 images with fixed code

4. **Update Container Apps:** Deploy v3 images to Container Apps

---

## Dockerfile Summary

### worker-scraper
- **Path:** `apps/worker-scraper/Dockerfile`
- **CMD:** `["node", "dist/scraper/index.js"]`
- **Entrypoint:** `dist/scraper/index.js`
- **Workspace Package:** `scraper-sync`

### worker-tracker
- **Path:** `apps/worker-tracker/Dockerfile`
- **CMD:** `["node", "dist/tracker/index.js"]`
- **Entrypoint:** `dist/tracker/index.js`
- **Workspace Package:** `shipping-engine`

### worker-autosell
- **Path:** `apps/worker-autosell/Dockerfile`
- **CMD:** `["node", "dist/autosell/index.js"]`
- **Entrypoint:** `dist/autosell/index.js`
- **Workspace Package:** `profit-engine`

---

## Container Apps Configuration

All workers are configured with:
- **CPU:** 0.5
- **Memory:** 1.0Gi
- **Min Replicas:** 1
- **Max Replicas:** 3
- **Ingress:** Internal
- **Target Port:** 8080

**Environment Variables:**
- `SUPABASE_URL` (secretref:supabase-url)
- `SUPABASE_SERVICE_ROLE_KEY` (secretref:supabase-service-role-key)
- `SUPABASE_ANON_KEY` (secretref:supabase-anon-key)
- `NODE_ENV=production`
- `LOG_LEVEL=info`

**Secrets:** All Supabase secrets are properly configured and referenced.

---

## Verification Status

✅ **Dockerfiles:** All simplified and using NO-BUILD pattern  
✅ **Images:** All built successfully for linux/amd64  
✅ **ACR Push:** All images pushed successfully  
✅ **Container Apps:** All updated to v2 images  
✅ **Provisioning:** All apps show "Succeeded" status  
✅ **Running Status:** All apps show "Running" status  
⚠️ **Runtime:** Module resolution errors preventing actual execution

---

## Notes

- Dockerfiles now follow a clean NO-BUILD pattern
- Images are properly tagged with v2
- Container Apps are updated and running
- The @azure/functions dependency is correctly included in package.json
- The remaining issue is a TypeScript/ESM module resolution problem, not a Dockerfile issue

---

## Next Actions Required

1. Fix ESM import paths in source files (add `.js` extensions)
2. Rebuild all packages and workers
3. Rebuild Docker images (v3)
4. Push to ACR
5. Update Container Apps to v3
6. Verify logs show successful startup

---

**Report Generated:** 2025-12-04  
**All Dockerfile and deployment infrastructure work completed successfully.**

