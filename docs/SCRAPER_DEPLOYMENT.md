# Live Marketplace Scraper Deployment Guide

## Overview

The Magnus Flipper AI Live Marketplace Scraper Synchronization Engine is a production-ready, real scraping system that uses Playwright to extract listings from:

- **Facebook Marketplace** - Login flow, infinite scroll, dynamic content
- **Craigslist** - Multi-city support, pagination
- **eBay** - Condition detection, shipping parsing, seller info
- **Vinted** - API-based scraping with session management
- **Depop** - Infinite scroll, seller detection
- **Gumtree** - UK marketplace support

## Architecture

```
packages/scraper-sync/
├── scrapers/          # Real Playwright scrapers for each marketplace
├── normalization/     # Data cleaning and standardization
├── ingestion/         # Supabase storage with deduplication
├── telemetry/         # Health monitoring and logging
├── orchestrator/      # Scraper execution management
└── utils/             # Browser automation with anti-bot measures

apps/worker-scraper/   # Azure Function CRON orchestrator (runs every 6 hours)

supabase/migrations/
└── 0014_scraper_sync_tables.sql  # Database schema
```

## Database Schema

### `scraped_listings`
- **Core fields**: title, price, link, images, seller info
- **Normalization**: normalized_title, normalized_price, normalized_condition
- **Deduplication**: content_hash (SHA-256), duplicate_group_id
- **Freshness**: freshness_score (0-100, exponential decay), first/last_seen_at
- **Anomaly detection**: is_anomaly, anomaly_reason, anomaly_score
- **Indexes**: marketplace, freshness, content_hash, duplicates, anomalies, full-text search

### `scraper_health`
- Tracks: status (healthy/degraded/down), last_run_at, success rate, avg items, errors
- One row per marketplace

### `scraper_logs`
- Detailed execution logs: duration, items scraped, errors per run

### `scraper_configs`
- User-specific configurations: search queries, location, price range, max pages, delays

## Environment Variables

### Required for All Scrapers
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Facebook Marketplace (Optional - Login)
```bash
FACEBOOK_EMAIL=your-email@example.com
FACEBOOK_PASSWORD=your-password
```

### Proxy Configuration (Optional)
```bash
PROXY_LIST=http://proxy1:port,http://proxy2:port
USE_PROXIES=true
```

## Deployment Steps

### 1. Install Playwright Browsers
```bash
cd packages/scraper-sync
pnpm install
npx playwright install chromium
```

### 2. Run Database Migration
```bash
cd supabase
supabase migration up 0014_scraper_sync_tables.sql
```

### 3. Deploy Azure Function Worker
```bash
cd apps/worker-scraper
pnpm build

# Deploy to Azure
az functionapp deployment source config-zip \
  --resource-group your-rg \
  --name scraper-worker \
  --src dist.zip
```

### 4. Configure Environment Variables in Azure
```bash
az functionapp config appsettings set \
  --name scraper-worker \
  --resource-group your-rg \
  --settings \
    SUPABASE_URL="https://your-project.supabase.co" \
    SUPABASE_SERVICE_ROLE_KEY="your-key" \
    FACEBOOK_EMAIL="your-email" \
    FACEBOOK_PASSWORD="your-password"
```

### 5. Create Default Scraper Configs
Insert default configs into `scraper_configs` table:
```sql
INSERT INTO scraper_configs (user_id, marketplace, enabled, search_queries, location, max_pages, delay_min_ms, delay_max_ms, use_proxy, headless)
VALUES
  ('system-user-uuid', 'facebook', true, ARRAY['furniture', 'electronics', 'collectibles'], 'New York', 3, 2000, 5000, false, true),
  ('system-user-uuid', 'craigslist', true, ARRAY['vintage', 'antique', 'collectibles'], 'newyork', 5, 2000, 5000, false, true),
  ('system-user-uuid', 'ebay', true, ARRAY['collectibles', 'vintage'], NULL, 5, 2000, 5000, false, true),
  ('system-user-uuid', 'vinted', true, ARRAY['designer', 'vintage'], NULL, 3, 2000, 5000, false, true),
  ('system-user-uuid', 'depop', true, ARRAY['vintage', 'streetwear'], NULL, 3, 2000, 5000, false, true),
  ('system-user-uuid', 'gumtree', true, ARRAY['furniture', 'electronics'], 'london', 3, 2000, 5000, false, true);
```

## Anti-Bot Measures Implemented

### Browser Fingerprinting Evasion
- Removes `navigator.webdriver` property
- Adds realistic `navigator.plugins`
- Sets proper User-Agent, Accept headers, timezone
- Randomized viewport sizes
- Chrome runtime object injection

### Human-Like Behavior
- Random delays between actions (2-5 seconds configurable)
- Human-like mouse movements with Bezier curves
- Gradual scrolling with random pauses
- Random viewport jitter

### Request Patterns
- Respects robots.txt (in production)
- Rate limiting per marketplace
- Request throttling with exponential backoff
- Proxy rotation support

## Usage Examples

### Run Single Marketplace Scraper
```typescript
import { ScraperOrchestrator } from "@magnus-flipper-ai/scraper-sync";

const orchestrator = new ScraperOrchestrator(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const config = {
  marketplace: "ebay",
  enabled: true,
  search_queries: ["vintage camera", "antique watches"],
  max_pages: 5,
  delay_min_ms: 2000,
  delay_max_ms: 5000,
  use_proxy: false,
  headless: true,
};

const result = await orchestrator.runScraper("ebay", config);
console.log(`Scraped ${result.total_scraped} items in ${result.duration_ms}ms`);
```

### Check Scraper Health
```typescript
import { ScraperMonitor } from "@magnus-flipper-ai/scraper-sync";

const monitor = new ScraperMonitor(supabaseUrl, supabaseKey);
const health = await monitor.checkScraperHealth();

console.log("Healthy:", health.healthy);
console.log("Degraded:", health.degraded);
console.log("Down:", health.down);
```

### Get Fresh Listings
```typescript
import { IngestionPipeline } from "@magnus-flipper-ai/scraper-sync";

const pipeline = new IngestionPipeline(supabaseUrl, supabaseKey);
const fresh = await pipeline.getFreshListings("ebay", 80, 100);

console.log(`Found ${fresh.length} fresh eBay listings with freshness > 80`);
```

## Monitoring & Alerts

### Health Check Endpoint
Create API route at `/api/scraper/health`:
```typescript
export async function GET() {
  const monitor = new ScraperMonitor(supabaseUrl, supabaseKey);
  const health = await monitor.checkScraperHealth();
  return Response.json(health);
}
```

### Stale Scraper Detection
```typescript
const monitor = new ScraperMonitor(supabaseUrl, supabaseKey);
const staleScrapers = await monitor.checkStaleScrapers(24); // 24 hours

if (staleScrapers.length > 0) {
  console.error("Stale scrapers detected:", staleScrapers);
  // Send alert via email/Slack
}
```

### Performance Metrics
```typescript
const stats = await monitor.getPerformanceStats("facebook");
console.log({
  successRate: stats.success_rate,
  avgDuration: stats.avg_duration_ms,
  avgItems: stats.avg_items_scraped,
  itemsPerSecond: stats.items_per_second,
});
```

## Deduplication Strategy

### Content Hash Generation
```
content_hash = SHA256(normalized_title + rounded_price + marketplace)
```

### Duplicate Group Detection
Listings with identical content_hash are grouped:
```typescript
const pipeline = new IngestionPipeline(supabaseUrl, supabaseKey);
const duplicates = await pipeline.getDuplicateGroups();

// Returns groups with multiple listings having same content_hash
duplicates.forEach(group => {
  console.log(`Duplicate group: ${group.marketplaces.join(", ")}`);
  console.log(`Price range: $${group.min_price} - $${group.max_price}`);
});
```

## Anomaly Detection

### Criteria
- Price > 2.5 standard deviations below category mean
- Suspicious round prices (e.g., exactly $100, $200)
- Missing images
- Unusual seller patterns

### Review Anomalies
```typescript
const anomalies = await pipeline.getAnomalousListings(50);
anomalies.forEach(listing => {
  console.log(`${listing.title}: ${listing.anomaly_reason}`);
  console.log(`Anomaly score: ${listing.anomaly_score}`);
});
```

## Freshness Scoring

### Algorithm
```
freshness_score = 100 * exp(-age_in_hours / 48)
```

- 0 hours old: 100 score
- 24 hours old: ~60 score
- 48 hours old: ~37 score
- 168 hours (1 week): ~3 score

### Auto-Marking Stale
```typescript
// Mark listings not seen in 48 hours as stale
const staleCount = await pipeline.markStaleListings("facebook", 48);
```

## Cleanup & Maintenance

### Delete Old Listings
```typescript
// Delete listings older than 30 days
const deleted = await pipeline.cleanupOldListings(30);
console.log(`Deleted ${deleted} old listings`);
```

### Scraper Health Dashboard
Query `scraper_health` table:
```sql
SELECT
  marketplace,
  status,
  last_success_at,
  total_runs,
  error_rate,
  avg_items_per_run
FROM scraper_health
ORDER BY marketplace;
```

## Troubleshooting

### Scraper Failing
1. Check `scraper_logs` for error messages
2. Verify marketplace website hasn't changed structure
3. Check if IP is blocked (use proxy)
4. Verify Playwright browsers are installed
5. Check rate limiting (increase delays)

### Low Item Count
1. Verify search queries are valid
2. Check max_pages setting
3. Verify location is correct
4. Check price filters aren't too restrictive

### High Error Rate
1. Enable proxy rotation
2. Increase delays between requests
3. Check if marketplace requires login
4. Verify cookies are being saved/loaded

## Performance Optimization

### Concurrent Scraping
```typescript
// Run multiple marketplaces concurrently
const configs = {
  ebay: ebayConfig,
  facebook: facebookConfig,
  craigslist: craigslistConfig,
};

const results = await orchestrator.runAllScrapers(configs);
```

### Headless vs Headed
- **Production**: Use `headless: true` for performance
- **Development**: Use `headless: false` to debug selectors

### Proxy Rotation
```typescript
const config = {
  ...baseConfig,
  use_proxy: true,
  proxy_list: [
    "http://proxy1.example.com:8080",
    "http://proxy2.example.com:8080",
    "http://proxy3.example.com:8080",
  ],
};
```

## Legal & Ethical Considerations

1. **Respect robots.txt** - Check each marketplace's robots.txt
2. **Rate limiting** - Don't overwhelm servers (2-5s delays)
3. **Terms of Service** - Review each marketplace's ToS
4. **Data usage** - Only scrape publicly available data
5. **Attribution** - Maintain source marketplace in data

## Folder Tree

```
packages/scraper-sync/
├── index.ts                        # Main exports
├── package.json                    # Dependencies (playwright, p-queue, zod)
├── tsconfig.json                   # TypeScript config
├── types/
│   └── ScrapedListing.ts          # Unified schema + Zod validators
├── scrapers/
│   ├── facebookMarketplace.ts     # FB login, infinite scroll
│   ├── craigslist.ts              # Multi-city, pagination
│   ├── ebay.ts                    # Condition parsing, seller extraction
│   ├── vinted.ts                  # API-based scraping
│   ├── depop.ts                   # Infinite scroll
│   └── gumtree.ts                 # UK marketplace
├── normalization/
│   └── normalizer.ts              # Title/price/condition normalization, deduplication
├── ingestion/
│   └── pipeline.ts                # Supabase storage, duplicate detection
├── telemetry/
│   └── monitor.ts                 # Health metrics, performance tracking
├── orchestrator/
│   └── scraperOrchestrator.ts     # Execution management
└── utils/
    └── browserManager.ts          # Playwright automation + anti-bot

apps/worker-scraper/
├── package.json                   # Azure Function dependencies
├── host.json                      # Function runtime config
├── tsconfig.json                  # TypeScript config
├── .funcignore                    # Ignore patterns
└── scraper/
    ├── function.json              # Timer trigger (every 6 hours)
    └── index.ts                   # Azure Function handler

supabase/migrations/
└── 0014_scraper_sync_tables.sql   # Database schema
```

## API Endpoints (Next.js)

### Get Fresh Listings
```typescript
// app/api/scraper/fresh/route.ts
export async function GET(request: NextRequest) {
  const marketplace = request.nextUrl.searchParams.get("marketplace");
  const pipeline = new IngestionPipeline(supabaseUrl, supabaseKey);
  const listings = await pipeline.getFreshListings(marketplace, 70, 100);
  return Response.json({ listings });
}
```

### Get Scraper Health
```typescript
// app/api/scraper/health/route.ts
export async function GET() {
  const monitor = new ScraperMonitor(supabaseUrl, supabaseKey);
  const health = await monitor.checkScraperHealth();
  return Response.json(health);
}
```

### Trigger Manual Scrape
```typescript
// app/api/scraper/trigger/route.ts
export async function POST(request: NextRequest) {
  const { marketplace, config } = await request.json();
  const orchestrator = new ScraperOrchestrator(supabaseUrl, supabaseKey);
  const result = await orchestrator.runScraper(marketplace, config);
  return Response.json(result);
}
```

## Production Checklist

- [ ] Install Playwright browsers on server
- [ ] Configure environment variables
- [ ] Run database migrations
- [ ] Deploy Azure Function worker
- [ ] Create default scraper configs
- [ ] Set up monitoring/alerting
- [ ] Configure proxy rotation (optional)
- [ ] Set up automated cleanup job
- [ ] Test each marketplace scraper
- [ ] Monitor error rates
- [ ] Review anomaly detection
- [ ] Check duplicate detection working
- [ ] Verify freshness scoring
- [ ] Set up health check endpoint

## Next Steps

1. **Dashboard**: Build UI to view/manage scraped listings
2. **Alerts**: Email/Slack notifications for down scrapers
3. **ML Enhancement**: Train models on scraped data for better predictions
4. **Proxy Pool**: Integrate residential proxy service
5. **Captcha Solving**: Add 2Captcha/Anti-Captcha integration
6. **Multi-Region**: Deploy workers in different regions
