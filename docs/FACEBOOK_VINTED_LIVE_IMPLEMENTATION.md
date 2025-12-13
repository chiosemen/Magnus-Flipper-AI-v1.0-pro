# Facebook + Vinted Live Integration Implementation

## Overview

This document describes the end-to-end implementation for making Facebook Marketplace and Vinted "LIVE" with a safe, ToS-compliant ingestion pipeline.

## Architecture

### Components

1. **Marketplace Adapters** (`packages/marketplaces/`)
   - `FacebookAdapter`: Hydrates listings from Facebook Marketplace URLs
   - `VintedAdapter`: Hydrates listings from Vinted URLs
   - Shared interface: `MarketplaceAdapter` with `hydrate(url)` method

2. **Ingestion API** (`apps/web/app/api/ingest/[marketplace]/submit/`)
   - `POST /api/ingest/facebook/submit` - Accepts `{ url: string }`
   - `POST /api/ingest/vinted/submit` - Accepts `{ url: string }`
   - Stores URL in database with status "Pending hydration..."

3. **Marketplace Listings API** (`apps/web/app/api/marketplaces/[marketplace]/live/`)
   - `GET /api/marketplaces/facebook/live?limit=50`
   - `GET /api/marketplaces/vinted/live?limit=50`
   - Returns latest active listings

4. **Worker Jobs** (`apps/worker-realtime/src/jobs/hydrateListing.ts`)
   - `hydrateListing()`: Hydrates a single URL using the adapter
   - `processPendingListings()`: Processes all pending listings in batches
   - Runs every 2 minutes in worker-realtime

5. **Scheduler Re-hydration** (`apps/worker-scheduler/src/hydration.ts`)
   - `rehydrateListings()`: Re-hydrates listings older than 30 minutes
   - Runs every 30 minutes in worker-scheduler

6. **Health Endpoint** (`apps/web/app/api/health/workers/`)
   - `GET /api/health/workers`
   - Returns last success time per marketplace
   - UI uses this to show "Live scanning" vs "Pipeline offline"

7. **UI Updates**
   - Marketplace pages (`/marketplaces/facebook`, `/marketplaces/vinted`) now use new API
   - `MarketplaceStatus` component shows real-time pipeline status
   - `LiveDealsGrid` component updated to use new marketplace API

## Environment Variables

### Web (Vercel)
```bash
NEXT_PUBLIC_API_BASE_URL=https://api.flipperagents.com
NEXT_PUBLIC_LIVE_MARKETPLACES=facebook,vinted
```

### API/Workers (Azure/Render/etc.)
```bash
LIVE_MARKETPLACES=facebook,vinted
INGESTION_MODE=submit  # Options: submit|extension|provider
DATABASE_URL=...
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## Data Flow

### User Submission Flow
1. User submits URL via `POST /api/ingest/facebook/submit` or `/api/ingest/vinted/submit`
2. API stores listing with `title: "Pending hydration..."`
3. Worker-realtime picks up pending listings every 2 minutes
4. Worker calls adapter's `hydrate(url)` method
5. Adapter extracts data from URL (HTML parsing or API)
6. Worker upserts listing with hydrated data
7. Listing appears on `/marketplaces/facebook` or `/marketplaces/vinted`

### Periodic Re-hydration Flow
1. Worker-scheduler runs every 30 minutes
2. Finds listings older than 30 minutes or with status "unknown"
3. Re-hydrates to update price/availability
4. Updates `lastSeen` timestamp

## Usage

### Submitting a Listing URL

```bash
curl -X POST https://api.flipperagents.com/api/ingest/facebook/submit \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.facebook.com/marketplace/item/123456789"}'
```

### Fetching Live Listings

```bash
curl https://api.flipperagents.com/api/marketplaces/facebook/live?limit=50
```

### Checking Worker Health

```bash
curl https://api.flipperagents.com/api/health/workers
```

Response:
```json
{
  "timestamp": "2024-01-01T00:00:00Z",
  "marketplaces": {
    "facebook": {
      "status": "live",
      "lastSuccess": "2024-01-01T00:00:00Z",
      "lastSuccessAgo": 120,
      "recentListings": 5
    },
    "vinted": {
      "status": "live",
      "lastSuccess": "2024-01-01T00:00:00Z",
      "lastSuccessAgo": 180,
      "recentListings": 3
    }
  }
}
```

## Implementation Details

### Adapter Hydration Strategy

**Facebook:**
- Extracts listing ID from URL
- Attempts HTML parsing for title, price, location, image
- Falls back to storing URL with minimal data if hydration fails
- Marks status as "unknown" if unable to parse

**Vinted:**
- Extracts item ID from URL
- Attempts Vinted API call first (`/api/v2/items/{id}`)
- Falls back to HTML parsing if API fails
- Extracts title, price, currency, location, image

### Error Handling

- Failed hydrations are stored with `status: "unknown"`
- Pending listings are retried every 2 minutes
- Re-hydration runs every 30 minutes for stale listings
- Health endpoint shows "offline" if no listings in last 10 minutes

### Rate Limiting

- Worker processes pending listings in batches of 50
- 1 second delay between each hydration
- 2 second delay between re-hydrations
- Respects `LIVE_MARKETPLACES` env var to skip non-enabled marketplaces

## Deployment Checklist

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Build Packages
```bash
pnpm --filter @magnus-flipper-ai/marketplaces build
pnpm --filter worker-realtime build
pnpm --filter worker-scheduler build
pnpm --filter web build
```

### 3. Set Environment Variables

**Vercel (Web):**
- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_LIVE_MARKETPLACES=facebook,vinted`

**Workers:**
- `LIVE_MARKETPLACES=facebook,vinted`
- `DATABASE_URL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### 4. Deploy

**Web:**
```bash
vercel deploy --prod
```

**Workers:**
Deploy `worker-realtime` and `worker-scheduler` to your infrastructure (Azure Container Apps, Render, etc.)

### 5. Verify

1. Submit a test URL:
```bash
curl -X POST https://your-api.com/api/ingest/facebook/submit \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.facebook.com/marketplace/item/YOUR_TEST_ID"}'
```

2. Wait 2-3 minutes for worker to hydrate

3. Check listings:
```bash
curl https://your-api.com/api/marketplaces/facebook/live
```

4. Check health:
```bash
curl https://your-api.com/api/health/workers
```

5. Visit `/marketplaces/facebook` in browser - should show listings and "Live scanning" status

## Confidence Checklist

Before flipping `LIVE_MARKETPLACES=facebook,vinted`:

- [ ] Workers are running (check logs: `worker-scheduler` and `worker-realtime`)
- [ ] Database has recent listings (check `listings` table, `last_seen` < 10 minutes)
- [ ] API returns data: `curl /api/marketplaces/facebook/live`
- [ ] UI displays listings: `/marketplaces/facebook` shows cards
- [ ] Health endpoint shows "live": `curl /api/health/workers`
- [ ] Test submission works: Submit a URL, wait 2 minutes, verify it appears

## Future Enhancements

### Phase B: Browser Extension
- Browser extension captures listing data as user browses
- Posts to `/api/ingest/:marketplace/submit` automatically

### Phase C: Provider Feeds
- Integrate Apify actors or Bright Data datasets
- Scheduled pulls from provider APIs
- Externalized risk and compliance

### Phase D: Enhanced Hydration
- Browser automation (Puppeteer/Playwright) for full data extraction
- Authentication support for private listings
- Image extraction and processing

## Troubleshooting

### No Listings Appearing

1. Check worker logs:
   ```bash
   # worker-realtime logs
   # Look for "Processed X pending listings"
   ```

2. Check database:
   ```sql
   SELECT * FROM listings 
   WHERE marketplace IN ('facebook', 'vinted') 
   ORDER BY last_seen DESC 
   LIMIT 10;
   ```

3. Check health endpoint:
   ```bash
   curl /api/health/workers
   ```

### Hydration Failing

1. Check adapter logs for errors
2. Verify URL format is correct
3. Check if marketplace is in `LIVE_MARKETPLACES`
4. Review `metadata.raw.error` in database for specific errors

### UI Showing "Pipeline Offline"

1. Check if any listings exist in last 10 minutes
2. Verify workers are running
3. Check `LIVE_MARKETPLACES` env var is set correctly
4. Review worker logs for errors

## Files Created/Modified

### New Files
- `packages/marketplaces/` - Marketplace adapter package
- `apps/web/app/api/ingest/[marketplace]/submit/route.ts` - Ingestion endpoint
- `apps/web/app/api/marketplaces/[marketplace]/live/route.ts` - Listings API
- `apps/web/app/api/health/workers/route.ts` - Health endpoint
- `apps/worker-realtime/src/jobs/hydrateListing.ts` - Hydration job
- `apps/worker-scheduler/src/hydration.ts` - Re-hydration job
- `apps/web/app/marketplaces/[slug]/MarketplaceStatus.tsx` - Status component

### Modified Files
- `apps/worker-realtime/src/index.ts` - Added hydration job processing
- `apps/worker-scheduler/src/index.ts` - Added re-hydration scheduling
- `apps/web/marketing-swoopa/lib/api.ts` - Updated to use new marketplace API
- `apps/web/app/marketplaces/[slug]/page.tsx` - Added status component
- `apps/worker-realtime/package.json` - Added marketplace package dependency
- `apps/worker-scheduler/package.json` - Added marketplace package dependency
