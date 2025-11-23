# Docker Migration Checklist

## Overview
This checklist guides you through migrating to the new monorepo-aware Dockerfiles that properly handle PNPM workspace packages.

## What Changed

### Old Approach (Issues)
- ❌ Selective copying of package.json files
- ❌ Manual tracking of workspace dependencies
- ❌ Missing transitive dependencies (e.g., @magnus-flipper-ai/notifications)
- ❌ Complex multi-stage builds with explicit package lists
- ❌ Prone to "Cannot find module" errors at runtime

### New Approach (Fixed)
- ✅ Copy entire monorepo context (`COPY . .`)
- ✅ Automatic workspace dependency resolution
- ✅ All packages built together (`pnpm -r build`)
- ✅ Simplified, maintainable Dockerfiles
- ✅ Guaranteed workspace package availability

## Pre-Migration Checklist

- [ ] **Backup current setup**
  ```bash
  git branch backup-docker-$(date +%Y%m%d)
  ```

- [ ] **Stop running containers**
  ```bash
  docker-compose down
  ```

- [ ] **Clean Docker cache (optional but recommended)**
  ```bash
  docker system prune -a
  ```

- [ ] **Verify .dockerignore exists and includes:**
  ```
  node_modules
  dist
  .next
  .git
  .env.local
  *.log
  ```

## Migration Steps

### 1. Update All Dockerfiles ✅ COMPLETED
All Dockerfiles have been updated:
- [x] apps/worker-alerts/Dockerfile
- [x] apps/worker-crawler/Dockerfile
- [x] apps/worker-analyzer/Dockerfile
- [x] apps/api/Dockerfile
- [x] apps/scheduler/Dockerfile
- [x] apps/web/Dockerfile

### 2. Verify docker-compose.yml ✅ VERIFIED
The docker-compose.yml already uses correct build context (`context: .`) for all services.

### 3. Test Build Process

#### A. Build Individual Services
Test each service individually:

```bash
# Test worker-alerts
docker build -f apps/worker-alerts/Dockerfile -t magnus-worker-alerts:test .

# Test worker-crawler
docker build -f apps/worker-crawler/Dockerfile -t magnus-worker-crawler:test .

# Test worker-analyzer
docker build -f apps/worker-analyzer/Dockerfile -t magnus-worker-analyzer:test .

# Test api
docker build -f apps/api/Dockerfile -t magnus-api:test .

# Test scheduler
docker build -f apps/scheduler/Dockerfile -t magnus-scheduler:test .

# Test web
docker build -f apps/web/Dockerfile -t magnus-web:test .
```

#### B. Build All Services via Docker Compose
```bash
docker-compose build --no-cache
```

### 4. Verify Module Resolution

Test that workspace packages are properly resolved:

```bash
# Start a test container for worker-alerts
docker run --rm -it magnus-worker-alerts:test node -e "console.log(require('@magnus-flipper-ai/notifications'))"

# If successful, you should see the module exports, not "Cannot find module" error
```

### 5. Deploy and Test

#### A. Start Services
```bash
docker-compose up -d
```

#### B. Check Service Health
```bash
# View all service statuses
docker-compose ps

# Check logs for each service
docker-compose logs -f api
docker-compose logs -f worker-alerts
docker-compose logs -f worker-crawler
docker-compose logs -f worker-analyzer
docker-compose logs -f scheduler
docker-compose logs -f web
```

#### C. Verify No Module Errors
```bash
# Search for "Cannot find module" errors
docker-compose logs | grep -i "cannot find module"

# Should return no results if migration successful
```

### 6. Performance Validation

Monitor build times and image sizes:

```bash
# Check image sizes
docker images | grep magnus

# Compare with old images (if backed up)
# New images may be larger due to including all packages
# but this ensures reliability over size optimization
```

## Post-Migration Validation

- [ ] All services start successfully
- [ ] No "Cannot find module" errors in logs
- [ ] Health checks pass for all services
- [ ] API responds at http://localhost:4000/health
- [ ] Web app accessible at http://localhost:3000
- [ ] Workers process jobs from queue
- [ ] Scheduler creates scheduled jobs

## Rollback Plan

If issues occur:

```bash
# Stop new containers
docker-compose down

# Checkout previous Dockerfiles
git checkout HEAD~1 apps/*/Dockerfile

# Rebuild and restart
docker-compose build
docker-compose up -d
```

## Optimization Notes (Future)

The current Dockerfiles prioritize **reliability over size optimization**:

1. **Builder stage**: Includes entire monorepo to ensure all dependencies available
2. **Runner stage**: Copies all built packages to ensure workspace resolution works

### Future optimizations (only if needed):
- Add `.dockerignore` rules to exclude test files, docs, etc.
- Use `pnpm deploy` for production-only dependencies
- Split packages into runtime vs build-time only

**Current recommendation**: Keep current approach until stability proven in production.

## Troubleshooting

### Build fails with "No such file or directory"
- Ensure building from monorepo root
- Check .dockerignore doesn't exclude needed files

### Runtime "Cannot find module @magnus-flipper-ai/*"
- Verify package exists in packages/ directory
- Check pnpm-workspace.yaml includes the package
- Ensure `pnpm -r build` ran successfully in builder stage

### Image size concerns
- Current approach trades size for reliability
- Monitor actual usage before optimizing
- Typical service: 200-400MB (acceptable for monorepo)

### Slow builds
- Use BuildKit: `DOCKER_BUILDKIT=1 docker-compose build`
- Enable layer caching in CI/CD
- Consider multi-stage caching strategies

## Success Criteria

✅ Migration complete when:
1. All 6 services build without errors
2. All services start and stay healthy
3. No module resolution errors in logs
4. Application functions as expected
5. All integration tests pass

## Questions or Issues?

If you encounter problems:
1. Check logs: `docker-compose logs [service-name]`
2. Verify build context: Build from monorepo root
3. Review this checklist for missed steps
4. Use the rollback plan if needed
