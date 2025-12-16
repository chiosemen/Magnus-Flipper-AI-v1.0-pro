# Magnus Tech Trade - Technical Design Document

**Version:** 1.0  
**Author:** Magnus Engineering Team  
**Date:** 2025-12-16  
**Status:** Draft

---

## 1. Problem Statement

Magnus Flipper AI currently excels at scanning marketplaces for undervalued items, but lacks specialized capabilities for tech device valuation. Tech devices (smartphones, tablets, laptops) have unique pricing characteristics:

- **Rapid depreciation:** New models release annually, causing sharp value drops
- **Condition sensitivity:** Minor damage significantly impacts value
- **Attribute complexity:** Storage, color, carrier lock status affect price
- **Market fragmentation:** Prices vary significantly across CeX, Back Market, eBay, etc.

**Goal:** Build a market-signal-driven pricing engine that provides instant, accurate B2C quotes for tech device trade-ins, integrated as an add-on feature within the existing Magnus Flipper AI platform.

**Success Metrics:**
- Quote accuracy within ±10% of realized sale price
- < 200ms API response time (p95)
- > 95% device catalog coverage for top 500 devices
- Admin approval turnaround < 24 hours for new anchors

---

## 2. Non-Goals

The following are explicitly **out of scope** for this initial implementation:

1. **Full B2B Platform:** Bulk CSV trade-ins and dealer portals are deferred to future sprints
2. **Real-Time Market Making:** We are not building a live trading platform with bid/ask spreads
3. **Physical Inspection:** No computer vision or AI-based condition assessment
4. **International Pricing:** Initial release targets UK market only (GBP)
5. **Automated Anchor Approval:** All market signals require human review before use
6. **ML-Based Pricing:** Insufficient data volume; deterministic rule-based pricing first
7. **Mobile App Integration:** Web-only initially; mobile deferred

---

## 3. System Architecture

### 3.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              apps/web (Next.js)                              │
├─────────────────────────────────────────────────────────────────────────────┤
│  /api/tech-trade/quote     │  /api/tech-trade/devices  │  /api/admin/...    │
│  (B2C Quote Generation)    │  (Device Catalog Search)  │  (Anchor Mgmt)     │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       packages/tech-trade-core                               │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Pricing    │  │   Device     │  │   Anchor     │  │   Market     │    │
│  │   Engine     │  │   Catalog    │  │   Blending   │  │  Indicators  │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
│  ┌──────────────┐                                                           │
│  │   Policy     │                                                           │
│  │ Enforcement  │                                                           │
│  └──────────────┘                                                           │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         packages/core                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│  db.ts (Prisma Client)  │  schema.prisma (Tech Trade Models)                │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    packages/scraper-sync (Extended)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│  CeX Scraper  │  Back Market Scraper  │  → MarketAnchor (pending)           │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    apps/worker-scheduler                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│  Daily Job: market-anchors.ts → Scrape → Store → Await Approval             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Data Flow

```
1. DEVICE CATALOG POPULATION (Admin)
   Admin → POST /api/admin/tech-trade/devices → TechDevice table

2. MARKET SIGNAL INGESTION (Worker)
   Scheduler → scraper-sync → CeX/Back Market → MarketAnchor (pending)

3. ANCHOR APPROVAL (Admin)
   Admin → POST /api/admin/tech-trade/anchors/approve → MarketAnchor (approved)

4. B2C QUOTE GENERATION (User)
   User → POST /api/tech-trade/quote
        → Pricing Engine (base + condition + attributes + anchors + policy)
        → DeviceQuote (persisted)
        → Response with breakdown

5. LIQUIDITY MONITORING (Admin)
   Admin → GET /api/admin/tech-trade/indicators
        → Market Indicators (volume, confidence, momentum)
```

### 3.3 Module Responsibilities

| Module | Responsibility | Dependencies |
|--------|---------------|--------------|
| `pricing-engine.ts` | Calculate final quote from inputs | device-catalog, anchor-blending, policy-enforcement |
| `device-catalog.ts` | Search and retrieve device specs | @magnus-flipper-ai/core/db |
| `anchor-blending.ts` | Combine market signals with weights | @magnus-flipper-ai/core/db |
| `market-indicators.ts` | Compute liquidity/confidence metrics | @magnus-flipper-ai/core/db |
| `policy-enforcement.ts` | Apply business rules (floors, margins) | None (pure functions) |
| `types.ts` | TypeScript type definitions | None |

---

## 4. Data Models

### 4.1 TechDevice (Device Catalog)

```prisma
model TechDevice {
  id            String   @id @default(uuid()) @db.Uuid
  brand         String   // Apple, Samsung, Google
  model         String   // iPhone 13, Galaxy S22
  category      String   // smartphone, tablet, laptop
  releaseYear   Int      @map("release_year")
  basePrice     Float    @map("base_price") // GBP, "new" condition
  isActive      Boolean  @default(true) @map("is_active")
  createdAt     DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt     DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)

  attributes    DeviceAttribute[]
  anchors       MarketAnchor[]
  quotes        DeviceQuote[]

  @@unique([brand, model])
  @@index([brand])
  @@index([category])
  @@index([isActive])
  @@map("tech_devices")
}
```

### 4.2 DeviceAttribute (Storage, Color, Carrier)

```prisma
model DeviceAttribute {
  id            String   @id @default(uuid()) @db.Uuid
  deviceId      String   @map("device_id") @db.Uuid
  attributeType String   @map("attribute_type") // storage, color, carrier
  attributeValue String  @map("attribute_value") // 128GB, Space Gray, Unlocked
  priceModifier Float    @map("price_modifier") // +50 or -20 (absolute GBP)
  createdAt     DateTime @default(now()) @map("created_at") @db.Timestamptz(6)

  device        TechDevice @relation(fields: [deviceId], references: [id], onDelete: Cascade)

  @@unique([deviceId, attributeType, attributeValue])
  @@index([deviceId])
  @@map("device_attributes")
}
```

### 4.3 MarketAnchor (CeX/Back Market Signals)

```prisma
model MarketAnchor {
  id            String   @id @default(uuid()) @db.Uuid
  deviceId      String   @map("device_id") @db.Uuid
  source        String   // cex, back_market
  condition     String   // new, excellent, good, fair
  price         Float    // Observed price in GBP
  url           String?  // Source URL for verification
  scrapedAt     DateTime @map("scraped_at") @db.Timestamptz(6)
  status        String   @default("pending") // pending, approved, rejected
  approvedAt    DateTime? @map("approved_at") @db.Timestamptz(6)
  approvedBy    String?  @map("approved_by") @db.Uuid
  createdAt     DateTime @default(now()) @map("created_at") @db.Timestamptz(6)

  device        TechDevice @relation(fields: [deviceId], references: [id], onDelete: Cascade)

  @@index([deviceId])
  @@index([source])
  @@index([status])
  @@index([scrapedAt])
  @@map("market_anchors")
}
```

### 4.4 DeviceQuote (User Quotes)

```prisma
model DeviceQuote {
  id            String   @id @default(uuid()) @db.Uuid
  deviceId      String   @map("device_id") @db.Uuid
  userId        String?  @map("user_id") @db.Uuid // nullable for anonymous quotes
  condition     String   // new, excellent, good, fair
  attributes    Json     // { storage: "128GB", color: "Black", carrier: "Unlocked" }
  
  // Price breakdown
  basePrice     Float    @map("base_price")
  conditionMultiplier Float @map("condition_multiplier")
  attributeAdjustment Float @map("attribute_adjustment")
  anchorBlendedPrice Float? @map("anchor_blended_price")
  policyAdjustment Float @map("policy_adjustment")
  finalPrice    Float    @map("final_price")
  
  // Metadata
  confidence    Float    // 0.0 - 1.0
  expiresAt     DateTime @map("expires_at") @db.Timestamptz(6)
  status        String   @default("pending") // pending, accepted, expired, rejected
  createdAt     DateTime @default(now()) @map("created_at") @db.Timestamptz(6)

  device        TechDevice @relation(fields: [deviceId], references: [id], onDelete: Cascade)

  @@index([deviceId])
  @@index([userId])
  @@index([status])
  @@index([createdAt])
  @@map("device_quotes")
}
```

### 4.5 PricingPolicy (Business Rules)

```prisma
model PricingPolicy {
  id            String   @id @default(uuid()) @db.Uuid
  name          String   @unique
  category      String?  // null = applies to all categories
  
  // Condition multipliers
  conditionNew       Float @default(1.0) @map("condition_new")
  conditionExcellent Float @default(0.85) @map("condition_excellent")
  conditionGood      Float @default(0.70) @map("condition_good")
  conditionFair      Float @default(0.50) @map("condition_fair")
  
  // Anchor weights
  weightCex          Float @default(0.40) @map("weight_cex")
  weightBackMarket   Float @default(0.40) @map("weight_back_market")
  weightPolicy       Float @default(0.20) @map("weight_policy")
  
  // Policy floors
  minMarginPercent   Float @default(0.15) @map("min_margin_percent") // 15% minimum margin
  absoluteFloor      Float @default(10.0) @map("absolute_floor") // Never below £10
  
  // Staleness
  anchorMaxAgeDays   Int   @default(7) @map("anchor_max_age_days")
  
  isActive      Boolean  @default(true) @map("is_active")
  createdAt     DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt     DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)

  @@index([category])
  @@index([isActive])
  @@map("pricing_policies")
}
```

---

## 5. API Surface

### 5.1 B2C Endpoints

#### `POST /api/tech-trade/quote`
Generate a quote for a device trade-in.

**Request:**
```json
{
  "deviceId": "uuid",
  "condition": "excellent",
  "attributes": {
    "storage": "128GB",
    "color": "Space Gray",
    "carrier": "Unlocked"
  }
}
```

**Response:**
```json
{
  "quoteId": "uuid",
  "device": {
    "brand": "Apple",
    "model": "iPhone 13"
  },
  "breakdown": {
    "basePrice": 450.00,
    "conditionMultiplier": 0.85,
    "afterCondition": 382.50,
    "attributeAdjustment": 30.00,
    "afterAttributes": 412.50,
    "anchorBlendedPrice": 395.00,
    "policyAdjustment": 0.00,
    "finalPrice": 395.00
  },
  "confidence": 0.92,
  "expiresAt": "2025-12-17T12:00:00Z",
  "status": "pending"
}
```

#### `GET /api/tech-trade/devices`
Search device catalog.

**Query Parameters:**
- `q` (string): Search query (fuzzy match on brand/model)
- `brand` (string): Filter by brand
- `category` (string): Filter by category
- `page` (int): Page number (default: 1)
- `limit` (int): Results per page (default: 20, max: 100)

**Response:**
```json
{
  "devices": [
    {
      "id": "uuid",
      "brand": "Apple",
      "model": "iPhone 13",
      "category": "smartphone",
      "releaseYear": 2021,
      "basePrice": 450.00,
      "attributes": [
        { "type": "storage", "values": ["64GB", "128GB", "256GB"] },
        { "type": "color", "values": ["Midnight", "Starlight", "Blue", "Pink", "Red"] }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### 5.2 Admin Endpoints

#### `POST /api/admin/tech-trade/anchors`
Approve or reject pending market anchors.

**Request:**
```json
{
  "anchorIds": ["uuid1", "uuid2"],
  "action": "approve" // or "reject"
}
```

#### `GET /api/admin/tech-trade/indicators`
Get market health indicators.

**Response:**
```json
{
  "volume": {
    "quotesToday": 150,
    "quotesThisWeek": 890,
    "quotesThisMonth": 3200
  },
  "anchors": {
    "total": 5000,
    "pending": 45,
    "approved": 4800,
    "rejected": 155,
    "stale": 120
  },
  "confidence": {
    "overall": 0.87,
    "bySource": {
      "cex": 0.91,
      "back_market": 0.83
    }
  },
  "momentum": {
    "trend": "stable", // up, down, stable
    "percentChange7d": -2.3
  }
}
```

---

## 6. Pricing Strategy

### 6.1 Pricing Formula

```
FinalPrice = max(
  PolicyFloor,
  blend(
    AnchorPrice(CeX) * WeightCeX,
    AnchorPrice(BackMarket) * WeightBackMarket,
    PolicyPrice * WeightPolicy
  )
)

Where:
  PolicyPrice = BasePrice * ConditionMultiplier + AttributeAdjustments
  PolicyFloor = max(AbsoluteFloor, PolicyPrice * (1 - MinMarginPercent))
```

### 6.2 Condition Multipliers

| Condition | Multiplier | Description |
|-----------|------------|-------------|
| New | 1.00 | Sealed, never used |
| Excellent | 0.85 | Like new, no visible wear |
| Good | 0.70 | Minor scratches, fully functional |
| Fair | 0.50 | Visible wear, may have cosmetic damage |

### 6.3 Anchor Blending

When market anchors are available:
- **CeX Weight:** 40% (high liquidity, reliable pricing)
- **Back Market Weight:** 40% (refurbished market benchmark)
- **Policy Weight:** 20% (internal pricing model)

When anchors are missing or stale:
- Fall back to 100% policy-based pricing
- Flag quote with low confidence (< 0.7)

### 6.4 Attribute Adjustments

| Attribute | Example | Adjustment |
|-----------|---------|------------|
| Storage (higher) | 256GB vs 128GB | +£30 |
| Storage (lower) | 64GB vs 128GB | -£25 |
| Color (rare) | Product Red | +£10 |
| Carrier (locked) | EE, Vodafone | -£40 |
| Carrier (unlocked) | Unlocked | +£0 |

---

## 7. Market Signal Ingestion

### 7.1 Scraper Architecture

Extend `packages/scraper-sync` with new scrapers:

```typescript
// packages/scraper-sync/scrapers/cex.ts
export async function scrapeCexPrices(devices: TechDevice[]): Promise<RawAnchor[]>

// packages/scraper-sync/scrapers/back-market.ts
export async function scrapeBackMarketPrices(devices: TechDevice[]): Promise<RawAnchor[]>
```

### 7.2 Worker Job

```typescript
// apps/worker-scheduler/src/jobs/market-anchors.ts
export const marketAnchorsJob = {
  name: 'market-anchors',
  schedule: '0 6 * * *', // Daily at 6 AM
  handler: async () => {
    const devices = await getActiveDevices();
    const cexAnchors = await scrapeCexPrices(devices);
    const backMarketAnchors = await scrapeBackMarketPrices(devices);
    await storeAnchors([...cexAnchors, ...backMarketAnchors], 'pending');
  }
};
```

### 7.3 Approval Workflow

```
1. Worker scrapes prices → MarketAnchor (status: pending)
2. Admin reviews in dashboard
3. Admin approves/rejects → MarketAnchor (status: approved/rejected)
4. Pricing engine only uses approved anchors
5. Rejected anchors logged for analysis
```

---

## 8. Liquidity & Confidence Indicators

### 8.1 Quote Volume

- **Daily:** Count of quotes in last 24 hours
- **Weekly:** Count of quotes in last 7 days
- **Monthly:** Count of quotes in last 30 days

### 8.2 Anchor Confidence

```typescript
function calculateAnchorConfidence(anchors: MarketAnchor[]): number {
  const freshness = anchors.filter(a => 
    daysSince(a.scrapedAt) <= policy.anchorMaxAgeDays
  ).length / anchors.length;
  
  const sourceAgreement = 1 - (standardDeviation(anchors.map(a => a.price)) / mean(anchors.map(a => a.price)));
  
  return (freshness * 0.6) + (sourceAgreement * 0.4);
}
```

### 8.3 Price Momentum

- **7-day trend:** Compare average anchor price this week vs last week
- **Direction:** up (> +5%), down (< -5%), stable (±5%)

---

## 9. Failure Modes & Mitigations

| Failure Mode | Detection | Mitigation |
|--------------|-----------|------------|
| Missing anchors | No approved anchors for device | Fall back to policy-only pricing, flag low confidence |
| Stale anchors | All anchors > 7 days old | Use stale anchors with confidence penalty |
| Scraper failure | Worker job error | Retry with backoff, alert ops team |
| Device not in catalog | deviceId not found | Return 404, log for catalog expansion |
| Quote manipulation | Abnormal request patterns | Rate limiting, input validation |
| Database unavailable | Prisma connection error | Return 503, circuit breaker |

---

## 10. Rollout Plan

### Sprint 1: Core Pricing Engine (Week 1)
- [ ] Prisma schema additions (TechDevice, DeviceAttribute, MarketAnchor, DeviceQuote, PricingPolicy)
- [ ] `packages/tech-trade-core` package setup
- [ ] Unit tests for pricing engine (TDD)
- [ ] Implementation: pricing-engine.ts, device-catalog.ts, policy-enforcement.ts

### Sprint 2: B2C Quote Flow (Week 2)
- [ ] API routes: `/api/tech-trade/quote`, `/api/tech-trade/devices`
- [ ] Request validation with Zod schemas
- [ ] Quote persistence and expiration
- [ ] Integration tests for quote flow

### Sprint 3: Market Signal Ingestion (Week 3)
- [ ] CeX scraper adapter
- [ ] Back Market scraper adapter
- [ ] Worker job for daily anchor ingestion
- [ ] anchor-blending.ts implementation

### Sprint 4: Admin Tools & Indicators (Week 4)
- [ ] Admin API routes: `/api/admin/tech-trade/anchors`, `/api/admin/tech-trade/indicators`
- [ ] market-indicators.ts implementation
- [ ] Admin UI for anchor approval
- [ ] Dashboard for liquidity indicators

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| Anchor | Market price signal from external source (CeX, Back Market) |
| Blending | Combining multiple price signals with weighted average |
| Condition | Physical state of device (new, excellent, good, fair) |
| Policy | Internal business rules for pricing (floors, margins) |
| Quote | Price offered to user for device trade-in |

---

## Appendix B: Open Questions

1. **Regional Expansion:** When do we add support for EUR, USD?
2. **B2B Timeline:** When do we prioritize bulk trade-in CSV flow?
3. **Depreciation Curves:** Should we model time-based depreciation?
4. **Scraper Rate Limits:** What are CeX/Back Market's rate limits?

---

**Document Status:** Ready for adversarial review (Phase 2)

