# Phase 11 - Live Marketplace Scraper Synchronization Engine

## Overview

High-frequency data ingestion system with deduplication, normalization, and delta-based updates for real-time marketplace arbitrage.

## Architecture

```
Marketplaces (6 sources)
    ↓
Fetch Raw Data
    ↓
Normalize to MarketListing
    ↓
Generate Fingerprints (Deterministic + Fuzzy)
    ↓
Deduplicate (Check existing)
    ↓
Delta Update (Changed fields only)
    ↓
Write to Supabase (Append-only + Snapshot)
    ↓
Emit Market Tick Event
    ↓
Feed to Deal Engine & Arbitrage Engine
```

## Package Structure

### Created:
- `packages/scraper-sync/` - Main package
- `package.json` - Dependencies (Supabase, Axios, Cheerio, Crypto)
- `tsconfig.json` - TypeScript configuration
- `types.ts` - Core type definitions
- `fingerprint/deterministic.ts` - Deterministic fingerprinting

### To Create:

#### 1. Fingerprinting
- `fingerprint/fuzzy.ts` - Fuzzy matching using Levenshtein distance
- `fingerprint/hash.ts` - Image hashing utilities
- `fingerprint/index.ts` - Combined fingerprinting

#### 2. Marketplace Clients
- `marketplaceClients/offerup.ts`
- `marketplaceClients/craigslist.ts`
- `marketplaceClients/ebay.ts`
- `marketplaceClients/vinted.ts`
- `marketplaceClients/facebook.ts`
- `marketplaceClients/gumtree.ts`

Each returns raw JSON from marketplace API/scraper.

#### 3. Normalizers
- `normalizer/normalizeOfferup.ts`
- `normalizer/normalizeCraigslist.ts`
- `normalizer/normalizeEbay.ts`
- `normalizer/normalizeVinted.ts`
- `normalizer/normalizeFacebook.ts`
- `normalizer/normalizeGumtree.ts`
- `normalizer/index.ts` - Router

#### 4. Deduplication
- `dedupe/dedupeEngine.ts` - Main dedupe logic
- `dedupe/fuzzyMatcher.ts` - Fuzzy matching algorithms
- `dedupe/priceComparator.ts` - Price-based matching

#### 5. Database Writers
- `writer/upsertListing.ts` - Insert or update
- `writer/writeSnapshot.ts` - Append-only history
- `writer/deltaUpdate.ts` - Changed fields only

#### 6. Orchestrator
- `syncOrchestrator.ts` - Main sync pipeline
- `config.ts` - Sync configuration
- `index.ts` - Package exports

## Core Types

```typescript
export interface MarketListing {
  id: string;
  source: MarketplaceSource;
  title: string;
  price: number;
  currency: "USD" | "GBP" | "EUR";
  images: string[];
  url: string;
  location: string;
  description?: string;
  condition?: string;
  category?: string;
  createdAt: string;
  updatedAt: string;
  seller: {
    id: string;
    name?: string;
    rating?: number;
    verified?: boolean;
  };
  metadata: Record<string, any>;
}

export interface ListingFingerprint {
  deterministic: string;
  fuzzy: {
    titleHash: string;
    imageHash?: string;
    priceRange: string;
    combinedScore: number;
  };
}

export interface SyncCycleResult {
  success: boolean;
  totalItems: number;
  totalInserted: number;
  totalUpdated: number;
  totalDeduped: number;
  marketplaceStats: SyncStats[];
  errors: Array<{ marketplace: string; error: string }>;
  cycleId: string;
  timestamp: string;
}
```

## Database Schema

### market_listings (latest version)
```sql
CREATE TABLE market_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT NOT NULL,
  fingerprint TEXT NOT NULL UNIQUE,
  source TEXT NOT NULL,
  title TEXT NOT NULL,
  price NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  images JSONB DEFAULT '[]',
  url TEXT NOT NULL,
  location TEXT,
  description TEXT,
  condition TEXT,
  category TEXT,
  seller_id TEXT NOT NULL,
  seller_name TEXT,
  seller_rating NUMERIC,
  seller_verified BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  first_seen_at TIMESTAMPTZ DEFAULT now(),
  last_seen_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_market_listings_fingerprint ON market_listings(fingerprint);
CREATE INDEX idx_market_listings_source ON market_listings(source);
CREATE INDEX idx_market_listings_price ON market_listings(price);
CREATE INDEX idx_market_listings_updated ON market_listings(updated_at DESC);
CREATE INDEX idx_market_listings_seller ON market_listings(seller_id);
```

### market_listings_snapshot (append-only history)
```sql
CREATE TABLE market_listings_snapshot (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES market_listings(id),
  fingerprint TEXT NOT NULL,
  snapshot_data JSONB NOT NULL,
  price_at_snapshot NUMERIC,
  changes JSONB,
  snapshot_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_snapshot_listing ON market_listings_snapshot(listing_id);
CREATE INDEX idx_snapshot_timestamp ON market_listings_snapshot(snapshot_at DESC);
CREATE INDEX idx_snapshot_price ON market_listings_snapshot(price_at_snapshot);
```

### sync_cycles (tracking)
```sql
CREATE TABLE sync_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id TEXT UNIQUE NOT NULL,
  total_items INTEGER DEFAULT 0,
  items_inserted INTEGER DEFAULT 0,
  items_updated INTEGER DEFAULT 0,
  items_deduped INTEGER DEFAULT 0,
  marketplace_stats JSONB DEFAULT '[]',
  errors JSONB DEFAULT '[]',
  duration_ms INTEGER,
  success BOOLEAN DEFAULT true,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_sync_cycles_started ON sync_cycles(started_at DESC);
CREATE INDEX idx_sync_cycles_success ON sync_cycles(success);
```

## Sync Orchestrator Flow

```typescript
export async function runSync(): Promise<SyncCycleResult> {
  const cycleId = generateCycleId();
  const startTime = Date.now();
  
  const marketplaceStats: SyncStats[] = [];
  const errors: Array<{ marketplace: string; error: string }> = [];
  
  let totalInserted = 0;
  let totalUpdated = 0;
  let totalDeduped = 0;
  
  // Process each marketplace
  for (const marketplace of MARKETPLACES) {
    try {
      // 1. Fetch raw data
      const raw = await fetchMarketplace(marketplace);
      
      // 2. Normalize
      const normalized = raw.map(item => normalize(item, marketplace));
      
      // 3. Fingerprint
      const fingerprinted = normalized.map(item => ({
        listing: item,
        fingerprint: generateFingerprint(item)
      }));
      
      // 4. Deduplicate
      for (const { listing, fingerprint } of fingerprinted) {
        const dedupeResult = await checkDuplicate(fingerprint);
        
        if (dedupeResult.isNew) {
          await insertListing(listing, fingerprint);
          totalInserted++;
        } else {
          const changed = await calculateDelta(listing, dedupeResult.matchedListingId);
          if (changed.length > 0) {
            await updateListing(dedupeResult.matchedListingId, changed);
            totalUpdated++;
          } else {
            totalDeduped++;
          }
        }
        
        // 5. Snapshot
        await writeSnapshot(listing, fingerprint);
      }
      
      marketplaceStats.push({
        marketplaceName: marketplace,
        itemsFetched: raw.length,
        itemsNormalized: normalized.length,
        // ... other stats
      });
      
    } catch (error) {
      errors.push({
        marketplace,
        error: error.message
      });
    }
  }
  
  // 6. Emit tick event
  await emitMarketTick(cycleId);
  
  // 7. Record cycle
  await recordSyncCycle({
    cycleId,
    totalItems: totalInserted + totalUpdated + totalDeduped,
    totalInserted,
    totalUpdated,
    totalDeduped,
    marketplaceStats,
    errors,
    durationMs: Date.now() - startTime
  });
  
  return {
    success: errors.length === 0,
    totalItems: totalInserted + totalUpdated + totalDeduped,
    totalInserted,
    totalUpdated,
    totalDeduped,
    marketplaceStats,
    errors,
    cycleId,
    timestamp: new Date().toISOString()
  };
}
```

## Deduplication Logic

```typescript
export async function checkDuplicate(
  fingerprint: ListingFingerprint
): Promise<DedupeResult> {
  // 1. Check deterministic match
  const exactMatch = await findByFingerprint(fingerprint.deterministic);
  if (exactMatch) {
    return {
      isNew: false,
      matchedListingId: exactMatch.id,
      matchType: "deterministic",
      confidence: 1.0
    };
  }
  
  // 2. Check fuzzy match
  const fuzzyMatches = await findFuzzyMatches(fingerprint.fuzzy);
  if (fuzzyMatches.length > 0) {
    const bestMatch = fuzzyMatches[0];
    if (bestMatch.score > 0.85) {
      return {
        isNew: false,
        matchedListingId: bestMatch.id,
        matchType: "fuzzy",
        confidence: bestMatch.score
      };
    }
  }
  
  // 3. No match - it's new
  return {
    isNew: true,
    matchType: "none",
    confidence: 0
  };
}
```

## Worker Integration

### apps/worker-sync/src/functions/runSyncCycle.ts
```typescript
import { AzureFunction, Context } from "@azure/functions";
import { runSync } from "@magnus-flipper-ai/scraper-sync";

const timerTrigger: AzureFunction = async function (
  context: Context,
  myTimer: any
): Promise<void> {
  context.log("Starting marketplace sync cycle...");
  
  try {
    const result = await runSync();
    
    context.log(`Sync completed: ${result.totalItems} items processed`);
    context.log(`Inserted: ${result.totalInserted}, Updated: ${result.totalUpdated}`);
    
    if (!result.success) {
      context.log.error("Sync had errors:", result.errors);
    }
    
  } catch (error) {
    context.log.error("Sync failed:", error);
    throw error;
  }
};

export default timerTrigger;
```

### Timer Configuration
```json
{
  "bindings": [
    {
      "name": "myTimer",
      "type": "timerTrigger",
      "direction": "in",
      "schedule": "0 * * * * *"
    }
  ]
}
```

## Admin Dashboard Pages

### /admin/sync-health
- Current sync status
- Last sync timestamp
- Success rate (24h, 7d, 30d)
- Average cycle duration
- Items per minute throughput

### /admin/sync-lag
- Marketplace lag (time since last update)
- Stale listings count
- Missing sources alert

### /admin/source-errors
- Error rate per marketplace
- Recent error log
- Failed fetch attempts
- API health status

### /admin/snapshot-counts
- Total snapshots per day
- Growth rate
- Storage usage
- Retention policy status

### /admin/fingerprint-collisions
- Duplicate detection rate
- False positive analysis
- Fuzzy match accuracy
- Price drift analysis

## Environment Variables

```bash
# Marketplace API Keys
MARKETPLACE_OFFERUP_API_KEY=
MARKETPLACE_VINTED_CLIENT_ID=
MARKETPLACE_FACEBOOK_SESSION=
MARKETPLACE_EBAY_APP_ID=
MARKETPLACE_EBAY_CERT_ID=

# Sync Configuration
SYNC_INTERVAL_MS=60000
SYNC_BATCH_SIZE=100
FUZZY_MATCH_THRESHOLD=0.85
ENABLE_SNAPSHOTS=true
SNAPSHOT_RETENTION_DAYS=90

# Performance
MAX_CONCURRENT_FETCHES=5
REQUEST_TIMEOUT_MS=10000
RETRY_ATTEMPTS=3
```

## Performance Targets

- **Sync Cycle:** <30s for 1000 listings
- **Deduplication:** <10ms per listing
- **Fingerprinting:** <5ms per listing
- **Database Write:** <100ms for batch insert
- **Total Throughput:** 2000+ listings/minute

## Next Steps

1. Complete fingerprinting engine (fuzzy + hash)
2. Implement all 6 marketplace clients
3. Create normalizers for each source
4. Build deduplication engine
5. Implement database writers
6. Create sync orchestrator
7. Build worker sync function
8. Add admin telemetry dashboard
9. Create database migrations
10. Integration testing with live data

---

**Status:** Foundation Complete, Implementation In Progress 🚧
