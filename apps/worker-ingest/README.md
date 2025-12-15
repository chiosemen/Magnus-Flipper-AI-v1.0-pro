# Worker Ingest

BullMQ-based ingestion worker for MM Agent scraping jobs.

## Environment Variables

```bash
# Redis Configuration
REDIS_URL=redis://localhost:6379

# Worker Concurrency
INGEST_CONCURRENCY=10          # Global concurrent jobs
FB_BATCH_CONCURRENCY=2         # Facebook-specific limit

# Rate Limiting
INGEST_RATELIMIT_MAX=30        # Max jobs per window
INGEST_RATELIMIT_MS=60000      # Rate limit window (ms)

# Playwright Configuration
PLAYWRIGHT_HEADLESS=true       # Run browser in headless mode
```

## Development

```bash
# Start Redis locally
docker run -p 6379:6379 redis

# Start worker
pnpm --filter worker-ingest dev
```

## Architecture

- Listens to `ingest` queue from BullMQ
- Processes scrape jobs with controlled concurrency
- Uses hybrid scrapers (HTML-first, Playwright fallback)
- Updates Redis status and results in real-time
