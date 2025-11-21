# 🕷️ Marketplace Crawler Deployment Guide

**Status**: ✅ Production Ready with Playwright

## Overview

The Magnus Flipper marketplace crawler runs as a queue-based worker that uses Playwright to scrape listings from Facebook Marketplace, Vinted, Gumtree, and other platforms.

## Architecture

```
┌─────────────┐      ┌─────────────┐      ┌──────────────────┐
│  Scheduler  │─────>│ Redis Queue │─────>│ Worker Crawler   │
│             │      │  (BullMQ)   │      │  (Playwright)    │
└─────────────┘      └─────────────┘      └──────────────────┘
                                                    │
                                                    ▼
                                           ┌──────────────────┐
                                           │   Supabase DB    │
                                           │ (marketplace_    │
                                           │   listings)      │
                                           └──────────────────┘
```

## Deployment Options

### Option 1: Docker (Recommended for Local/VPS)

#### Local Development

```bash
# Build and start crawler with dependencies
cd /Users/chinyeosemene/Developer/Magnus-Flipper-AI-v1.0-pro

# Start infrastructure only
docker-compose up -d redis postgres

# Or start everything including crawler
docker-compose up -d

# View logs
docker-compose logs -f worker-crawler

# Scale crawlers
docker-compose up -d --scale worker-crawler=3
```

#### Production VPS (with Docker)

```bash
# 1. Clone repo on server
git clone <your-repo> /opt/magnus-flipper
cd /opt/magnus-flipper

# 2. Set environment variables
cat > .env.production << EOF
REDIS_URL=redis://redis:6379
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NODE_ENV=production
EOF

# 3. Build and start
docker-compose up -d worker-crawler

# 4. Monitor
docker-compose logs -f worker-crawler
docker stats worker-crawler
```

### Option 2: Render.com (Already Configured!)

The crawler is already configured in `render.yaml`:

```yaml
- type: worker
  name: magnus-flipper-worker-crawler
  env: node
  plan: starter
  region: oregon
  buildCommand: |
    pnpm install --frozen-lockfile
    npx playwright install --with-deps chromium
  startCommand: |
    node apps/worker-crawler/src/index.js
```

**Deployment**:
1. Push to GitHub
2. Connect repo to Render
3. Render will automatically deploy from `render.yaml`
4. Set environment variables in Render dashboard

### Option 3: PM2 (Local Development)

```bash
# Already configured in ecosystem.config.js
pm2 start ecosystem.config.js --only worker-crawler

# Scale to 2 instances
pm2 scale worker-crawler 2

# View logs
pm2 logs worker-crawler

# Monitor
pm2 monit
```

## Environment Variables

Required for all deployment methods:

```bash
# Redis (Queue)
REDIS_URL=redis://localhost:6379

# Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional
NODE_ENV=production
LOG_LEVEL=info
```

## Dockerfile Details

**Base Image**: `mcr.microsoft.com/playwright:v1.49.0-jammy`
- Includes Chromium browser
- Pre-installed system dependencies
- Ubuntu 22.04 LTS (Jammy)

**Build Steps**:
1. Copy monorepo files
2. Install pnpm globally
3. Install dependencies with `--frozen-lockfile`
4. Install Playwright browsers with system deps

**Runtime**:
- Runs as Node.js process
- Connects to Redis queue
- Processes crawl jobs continuously

## Docker Commands

### Build

```bash
# Build crawler image
docker build -f apps/worker-crawler/Dockerfile -t magnus-crawler .

# Build with specific tag
docker build -f apps/worker-crawler/Dockerfile -t magnus-crawler:v1.0.0 .
```

### Run

```bash
# Run single instance
docker run -d \
  --name magnus-crawler \
  -e REDIS_URL=redis://redis:6379 \
  -e SUPABASE_URL=https://your-project.supabase.co \
  -e SUPABASE_SERVICE_ROLE_KEY=your_key \
  magnus-crawler

# Run with docker-compose
docker-compose up -d worker-crawler
```

### Debug

```bash
# Interactive shell
docker exec -it magnus-crawler bash

# Check Playwright installation
docker exec magnus-crawler npx playwright --version

# Test browser launch
docker exec magnus-crawler node -e "const { chromium } = require('playwright'); chromium.launch().then(() => console.log('OK'))"

# View logs
docker logs -f magnus-crawler
```

## Scaling

### Docker Compose

```bash
# Scale to 3 crawler instances
docker-compose up -d --scale worker-crawler=3

# Check status
docker-compose ps
```

### Render

```yaml
# In render.yaml, add:
services:
  - type: worker
    name: magnus-flipper-worker-crawler
    numInstances: 3  # Scale to 3 instances
```

### PM2

```bash
# Scale to 3 instances
pm2 scale worker-crawler 3

# Auto-scale based on CPU
pm2 start ecosystem.config.js --only worker-crawler -i max
```

## Performance Tuning

### Memory Limits

**Docker Compose**:
```yaml
worker-crawler:
  deploy:
    resources:
      limits:
        memory: 1G
      reservations:
        memory: 512M
```

**Docker Run**:
```bash
docker run -d \
  --memory="1g" \
  --memory-reservation="512m" \
  magnus-crawler
```

### Concurrency

Edit `apps/worker-crawler/src/index.js`:

```javascript
// Process 5 jobs concurrently per worker
worker.concurrency = 5;

// Or set via environment
const concurrency = parseInt(process.env.WORKER_CONCURRENCY || '3');
```

### Browser Options

Optimize Playwright for headless servers:

```javascript
const browser = await chromium.launch({
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--disable-gpu',
  ],
});
```

## Monitoring

### Health Checks

```bash
# Check if worker is processing jobs
redis-cli -h localhost -p 6379 LLEN bull:crawl:waiting
redis-cli -h localhost -p 6379 LLEN bull:crawl:active
redis-cli -h localhost -p 6379 LLEN bull:crawl:completed
redis-cli -h localhost -p 6379 LLEN bull:crawl:failed
```

### Logs

```bash
# Docker
docker logs -f worker-crawler --tail 100

# Docker Compose
docker-compose logs -f worker-crawler

# PM2
pm2 logs worker-crawler --lines 100
```

### Metrics

```bash
# Docker stats
docker stats worker-crawler

# PM2 monitoring
pm2 monit
```

## Troubleshooting

### Issue: Playwright fails to launch browser

**Symptoms**:
```
Error: browserType.launch: Executable doesn't exist at /ms-playwright/chromium-<version>/chrome-linux/chrome
```

**Solution**:
```bash
# Reinstall Playwright browsers
docker exec worker-crawler npx playwright install --with-deps chromium

# Or rebuild Docker image
docker-compose build --no-cache worker-crawler
docker-compose up -d worker-crawler
```

### Issue: Out of memory

**Symptoms**:
```
FATAL ERROR: Reached heap limit Allocation failed
```

**Solutions**:

1. Increase memory limit:
```bash
docker run -d --memory="2g" magnus-crawler
```

2. Reduce concurrency:
```javascript
// In worker-crawler/src/index.js
worker.concurrency = 2; // Reduce from 5 to 2
```

3. Close browser contexts:
```javascript
// Always close contexts after use
await context.close();
await browser.close();
```

### Issue: Jobs stuck in queue

**Check**:
```bash
# Count jobs in each state
redis-cli LLEN bull:crawl:waiting
redis-cli LLEN bull:crawl:active

# Clear failed jobs
redis-cli DEL bull:crawl:failed
```

**Solution**:
```bash
# Restart worker
docker-compose restart worker-crawler

# Or with PM2
pm2 restart worker-crawler
```

### Issue: Rate limiting from marketplaces

**Solutions**:

1. Add delays between requests:
```javascript
await page.waitForTimeout(2000); // 2 second delay
```

2. Rotate user agents:
```javascript
await context.newPage({
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)...'
});
```

3. Use proxies (if needed):
```javascript
const browser = await chromium.launch({
  proxy: {
    server: 'http://proxy-server:8080'
  }
});
```

## Testing

### Local Test

```bash
# 1. Start Redis
docker-compose up -d redis

# 2. Start worker in dev mode
cd apps/worker-crawler
pnpm dev

# 3. Add test job to queue (from another terminal)
node -e "
const { Queue } = require('bullmq');
const queue = new Queue('crawl', { connection: { host: 'localhost', port: 6379 }});
queue.add('test-crawl', {
  marketplace: 'facebook',
  searchTerm: 'ps5',
  location: 'London'
});
"

# 4. Watch logs
pm2 logs worker-crawler
```

### Docker Test

```bash
# Build and run
docker-compose up --build worker-crawler

# Watch logs
docker-compose logs -f worker-crawler
```

## Production Checklist

- [ ] Playwright browsers installed (`npx playwright install --with-deps chromium`)
- [ ] Redis URL configured and accessible
- [ ] Supabase credentials set
- [ ] Memory limits configured (1GB recommended)
- [ ] Logging configured and monitored
- [ ] Multiple crawler instances running (2-3 recommended)
- [ ] Health checks passing
- [ ] Error handling and retry logic verified
- [ ] Rate limiting implemented
- [ ] Browser contexts properly closed

## Files Created

1. ✅ **`apps/worker-crawler/Dockerfile`**
   - Production-ready Playwright container
   - Based on official Playwright image
   - Includes all system dependencies

2. ✅ **`docker-compose.yml`**
   - Complete stack with Redis, PostgreSQL, Crawler
   - Health checks configured
   - Scaling support (2 crawler replicas)

3. ✅ **`apps/worker-crawler/.dockerignore`**
   - Optimizes Docker build size
   - Excludes node_modules, tests, logs

4. ✅ **`render.yaml`** (already existed, confirmed crawler config)
   - Worker service with Playwright installation
   - Proper build and start commands

## Quick Start Commands

```bash
# Local development with Docker
docker-compose up -d

# Production with PM2
pm2 start ecosystem.config.js

# Deploy to Render (already configured)
git push origin main

# Scale crawlers
docker-compose up -d --scale worker-crawler=3
```

---

**Status**: ✅ 100% Production Ready
**Last Updated**: November 20, 2025
**Pack 4/4**: Complete
