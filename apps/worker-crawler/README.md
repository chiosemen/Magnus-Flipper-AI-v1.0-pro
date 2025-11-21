# Magnus Worker – Crawler

This worker processes marketplace crawling jobs using Playwright-based crawlers.

## What it does

- Listens on queue: `scan:marketplace:*`
- Uses crawlers from `packages/crawlers` (Facebook Marketplace, Vinted, Gumtree, etc.)
- Persists listings to Supabase (`public.marketplace_listings`)
- Runs headless browser automation via Playwright

## Required Environment Variables

```bash
# Redis (Queue System)
REDIS_URL=redis://localhost:6379

# Supabase (Database)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Node Environment
NODE_ENV=production
```

## Optional Environment Variables

```bash
# Logging
LOG_LEVEL=info

# Worker Concurrency (how many jobs to process simultaneously)
WORKER_CONCURRENCY=3

# Marketplace-specific (add as needed)
FB_MARKETPLACE_PROXY_URL=http://proxy:8080
VINTED_API_KEY=your_vinted_key
```

## Run Locally

### Prerequisites

```bash
# Install dependencies (from monorepo root)
pnpm install

# Install Playwright browsers
npx playwright install --with-deps chromium
```

### Development Mode

```bash
# From monorepo root
cd apps/worker-crawler

# Run with ts-node
pnpm ts-node src/index.ts

# Or run compiled JavaScript
pnpm build
node src/index.js
```

### With Environment File

```bash
# Create .env file
cp .env.example .env

# Edit with your values
nano .env

# Run with environment
node -r dotenv/config src/index.js
```

## Run in Docker

### Build Image

```bash
# From monorepo root
docker build -f apps/worker-crawler/Dockerfile -t magnus-worker-crawler .
```

### Run Container

```bash
# Using environment file
docker run --env-file .env.production magnus-worker-crawler

# Or with inline environment variables
docker run \
  -e REDIS_URL=redis://redis:6379 \
  -e SUPABASE_URL=https://your-project.supabase.co \
  -e SUPABASE_SERVICE_ROLE_KEY=your_key \
  -e NODE_ENV=production \
  magnus-worker-crawler
```

### Run with Docker Compose

```bash
# From monorepo root
docker-compose up -d worker-crawler

# View logs
docker-compose logs -f worker-crawler

# Scale to multiple instances
docker-compose up -d --scale worker-crawler=3
```

## Deployment

### Render.com (Recommended)

Already configured in `render.yaml`:

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

Set environment variables in Render dashboard:
- `REDIS_URL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NODE_ENV=production`

### PM2 (Local/VPS)

```bash
# From monorepo root
pm2 start ecosystem.config.js --only worker-crawler

# Scale to 2 instances
pm2 scale worker-crawler 2

# View logs
pm2 logs worker-crawler
```

## Queue Jobs

The worker processes jobs with this structure:

```javascript
{
  jobName: 'scan:marketplace:facebook',
  data: {
    marketplace: 'facebook',
    profileId: 'uuid-here',
    searchTerm: 'vintage nike',
    location: 'London',
    minPrice: 10,
    maxPrice: 50,
    currency: 'GBP'
  }
}
```

### Add Test Job

```bash
# Using Redis CLI
redis-cli LPUSH bull:scan:marketplace:waiting '{"marketplace":"facebook","searchTerm":"ps5"}'

# Or via Node.js
node -e "
const { Queue } = require('bullmq');
const queue = new Queue('scan:marketplace', {
  connection: { host: 'localhost', port: 6379 }
});
queue.add('crawl-facebook', {
  marketplace: 'facebook',
  searchTerm: 'ps5',
  location: 'London'
});
"
```

## Monitoring

### Check Queue Status

```bash
# Jobs waiting
redis-cli LLEN bull:scan:marketplace:waiting

# Jobs active (being processed)
redis-cli LLEN bull:scan:marketplace:active

# Jobs completed
redis-cli LLEN bull:scan:marketplace:completed

# Jobs failed
redis-cli LLEN bull:scan:marketplace:failed
```

### View Logs

```bash
# Docker
docker logs -f worker-crawler

# Docker Compose
docker-compose logs -f worker-crawler

# PM2
pm2 logs worker-crawler
```

## Troubleshooting

### Playwright Browser Issues

**Problem**: Browser fails to launch

**Solution**:
```bash
# Reinstall browsers with dependencies
npx playwright install --with-deps chromium

# Or in Docker
docker exec worker-crawler npx playwright install --with-deps chromium
```

### Connection Issues

**Problem**: Cannot connect to Redis

**Solution**:
```bash
# Check Redis is running
redis-cli ping

# Check REDIS_URL format
# Should be: redis://host:port or rediss://host:port (for TLS)
```

**Problem**: Cannot connect to Supabase

**Solution**:
```bash
# Verify credentials
curl -H "apikey: YOUR_SERVICE_ROLE_KEY" \
  https://your-project.supabase.co/rest/v1/marketplace_listings?limit=1

# Check environment variables are set
echo $SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY
```

### Memory Issues

**Problem**: Out of memory errors

**Solutions**:
1. Reduce concurrency in worker config
2. Increase Docker memory limit: `docker run --memory="1g"`
3. Close browser contexts properly after each job

### Jobs Stuck in Queue

**Check**:
```bash
# See how many workers are connected
redis-cli CLIENT LIST | grep worker

# Check if jobs are being processed
redis-cli LLEN bull:scan:marketplace:active
```

**Solution**:
```bash
# Restart worker
pm2 restart worker-crawler
# or
docker-compose restart worker-crawler
```

## Performance Tuning

### Concurrency

Set `WORKER_CONCURRENCY` environment variable:

```bash
# Process 5 jobs simultaneously
WORKER_CONCURRENCY=5 node src/index.js
```

### Memory Optimization

In `src/index.js`, configure browser launch options:

```javascript
const browser = await chromium.launch({
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage', // Reduces memory usage
    '--disable-gpu',
  ],
});
```

### Rate Limiting

Add delays between requests to avoid marketplace blocks:

```javascript
await page.waitForTimeout(2000); // 2 second delay
```

## Development

### Project Structure

```
apps/worker-crawler/
├── src/
│   └── index.ts          # Main worker entry point
├── Dockerfile            # Production container
├── .dockerignore        # Docker build exclusions
├── .env.example         # Environment template
├── package.json
├── tsconfig.json
└── README.md            # This file
```

### Adding New Marketplaces

1. Create crawler in `packages/crawlers/[marketplace-name]`
2. Import in `src/index.ts`
3. Register queue handler
4. Update environment variables if needed

Example:

```typescript
// In src/index.ts
import { ebayScanner } from '@magnus-flipper-ai/crawlers/ebay';

worker.on('scan:marketplace:ebay', async (job) => {
  const listings = await ebayScanner.scan(job.data);
  await saveListings(listings);
});
```

## Testing

### Unit Tests

```bash
pnpm test
```

### Integration Tests

```bash
# Start dependencies
docker-compose up -d redis

# Run worker
pnpm dev

# Add test job
node scripts/add-test-job.js
```

### Manual Testing

```bash
# 1. Start Redis
docker-compose up -d redis

# 2. Start worker
pnpm dev

# 3. Add job via Redis CLI
redis-cli LPUSH bull:scan:marketplace:waiting '{"marketplace":"facebook","searchTerm":"test"}'

# 4. Watch logs
tail -f logs/worker-crawler.log
```

## Production Checklist

Before going live:

- [ ] Environment variables configured
- [ ] Playwright browsers installed
- [ ] Redis connection tested
- [ ] Supabase connection tested
- [ ] Memory limits set (1GB recommended)
- [ ] Concurrency configured (3-5 jobs recommended)
- [ ] Logging configured
- [ ] Error handling verified
- [ ] Rate limiting implemented
- [ ] Multiple instances running (2-3 recommended)
- [ ] Monitoring set up
- [ ] Browser contexts properly closed after jobs

## Support

For issues:
1. Check logs: `pm2 logs worker-crawler` or `docker logs worker-crawler`
2. Verify environment variables are set
3. Check Redis and Supabase connectivity
4. Review queue status with Redis CLI
5. Check available memory: `docker stats` or `free -h`

---

**Status**: Production Ready ✅
**Last Updated**: November 20, 2025
