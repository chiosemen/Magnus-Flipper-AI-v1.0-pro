# Magnus Tech Trade - Subsystem Specifications

**Version:** 1.0  
**Author:** Tech Lead  
**Date:** 2025-12-16  
**Status:** Approved

---

## Overview

This document specifies the six subsystems that compose Magnus Tech Trade. Each subsystem is designed to be independently buildable and testable.

**Subsystems:**
1. Device Catalog & Search
2. Pricing Engine
3. Market Signal Ingestion
4. Anchor Approval Flow
5. API Gateway (Next.js routes)
6. Liquidity Indicators

---

## 1. Device Catalog & Search

### 1.1 Responsibility

Manage the searchable registry of tech devices, including brand, model, specifications, and attribute options. Provide efficient search capabilities with fuzzy matching and filtering.

### 1.2 Inputs

| Input | Type | Source | Description |
|-------|------|--------|-------------|
| Search query | `string` | API request | Free-text search (e.g., "iPhone 13") |
| Brand filter | `string?` | API request | Exact brand match (e.g., "Apple") |
| Category filter | `string?` | API request | Device category (e.g., "smartphone") |
| Device ID | `string` | API request | UUID for single device lookup |
| Pagination | `{ page: number, limit: number }` | API request | Page controls |

### 1.3 Outputs

| Output | Type | Description |
|--------|------|-------------|
| Device list | `TechDevice[]` | Matching devices with attributes |
| Single device | `TechDevice` | Device with full attribute list |
| Pagination info | `{ page, limit, total, totalPages }` | Pagination metadata |
| Not found error | `Error` | When device ID doesn't exist |

### 1.4 Data Dependencies

```
┌─────────────────┐      ┌───────────────────┐
│   TechDevice    │──1:N─│  DeviceAttribute  │
└─────────────────┘      └───────────────────┘
```

- **TechDevice:** Primary device catalog table
- **DeviceAttribute:** Storage, color, carrier options per device

### 1.5 Interfaces

```typescript
// packages/tech-trade-core/src/device-catalog.ts

export interface DeviceSearchParams {
  query?: string;
  brand?: string;
  category?: string;
  page?: number;
  limit?: number;
}

export interface DeviceSearchResult {
  devices: TechDeviceWithAttributes[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface TechDeviceWithAttributes {
  id: string;
  brand: string;
  model: string;
  category: string;
  releaseYear: number;
  basePrice: number;
  currency: string;
  attributes: {
    type: string;
    values: string[];
    modifiers: { value: string; priceModifier: number }[];
  }[];
}

// Core functions
export async function searchDevices(params: DeviceSearchParams): Promise<DeviceSearchResult>;
export async function getDeviceById(deviceId: string): Promise<TechDeviceWithAttributes | null>;
export async function validateDeviceAttributes(deviceId: string, attributes: Record<string, string>): Promise<boolean>;
```

### 1.6 Failure Modes

| Failure | Detection | Response |
|---------|-----------|----------|
| Database unavailable | Prisma connection error | Return 503, log error |
| Invalid device ID | UUID validation fails | Return 400 with message |
| Device not found | Query returns null | Return 404 |
| Empty search results | Query returns [] | Return empty array (not error) |

### 1.7 Test Strategy

```typescript
// packages/tech-trade-core/__tests__/device-catalog.test.ts

describe('Device Catalog', () => {
  describe('searchDevices', () => {
    it('should return devices matching exact brand');
    it('should return devices matching fuzzy query (typo tolerance)');
    it('should filter by category');
    it('should paginate results correctly');
    it('should return empty array for no matches');
    it('should handle special characters in query');
  });

  describe('getDeviceById', () => {
    it('should return device with all attributes');
    it('should return null for non-existent device');
    it('should throw for invalid UUID format');
  });

  describe('validateDeviceAttributes', () => {
    it('should return true for valid attribute combination');
    it('should return false for invalid attribute type');
    it('should return false for invalid attribute value');
    it('should return false for missing required attributes');
  });
});
```

### 1.8 Performance Requirements

- Search latency: < 100ms (p95)
- Single device lookup: < 50ms (p95)
- Support 1000 devices in catalog without degradation

---

## 2. Pricing Engine

### 2.1 Responsibility

Calculate accurate trade-in quotes by combining base prices, condition multipliers, attribute adjustments, market anchor blending, and policy enforcement. Produce transparent price breakdowns.

### 2.2 Inputs

| Input | Type | Source | Description |
|-------|------|--------|-------------|
| Device | `TechDevice` | Device Catalog | Device with base price |
| Condition | `Condition` | API request | new, excellent, good, fair |
| Attributes | `Record<string, string>` | API request | Selected attributes |
| Anchors | `MarketAnchor[]` | Anchor Blending | Approved market signals |
| Policy | `PricingPolicy` | Database | Active pricing rules |

### 2.3 Outputs

| Output | Type | Description |
|--------|------|-------------|
| Quote | `QuoteBreakdown` | Full price calculation with breakdown |
| Confidence | `number` | 0.0-1.0 confidence score |
| Warnings | `string[]` | Any pricing warnings (e.g., stale anchors) |

### 2.4 Data Dependencies

```
┌─────────────────┐
│   TechDevice    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌─────────────────┐
│ DeviceAttribute │      │  MarketAnchor   │
└────────┬────────┘      └────────┬────────┘
         │                        │
         └────────────┬───────────┘
                      ▼
              ┌───────────────┐
              │ PricingPolicy │
              └───────┬───────┘
                      ▼
              ┌───────────────┐
              │  DeviceQuote  │
              └───────────────┘
```

### 2.5 Interfaces

```typescript
// packages/tech-trade-core/src/pricing-engine.ts

export type Condition = 'new' | 'excellent' | 'good' | 'fair';

export interface QuoteRequest {
  deviceId: string;
  condition: Condition;
  attributes: Record<string, string>;
  userId?: string;
}

export interface QuoteBreakdown {
  basePrice: number;
  conditionMultiplier: number;
  afterCondition: number;
  attributeAdjustment: number;
  afterAttributes: number;
  anchorBlendedPrice: number | null;
  policyAdjustment: number;
  finalPrice: number;
}

export interface QuoteResult {
  quoteId: string;
  device: {
    id: string;
    brand: string;
    model: string;
  };
  condition: Condition;
  attributes: Record<string, string>;
  breakdown: QuoteBreakdown;
  confidence: number;
  warnings: string[];
  expiresAt: Date;
  status: 'pending';
  anchorSnapshot: MarketAnchor[];
  policyId: string;
}

// Core functions
export async function generateQuote(request: QuoteRequest): Promise<QuoteResult>;
export function calculateBasePrice(device: TechDevice, condition: Condition, policy: PricingPolicy): number;
export function applyAttributeAdjustments(basePrice: number, attributes: Record<string, string>, deviceAttributes: DeviceAttribute[]): number;
export function applyPolicyFloor(price: number, policy: PricingPolicy): number;
```

### 2.6 Pricing Algorithm

```typescript
function generateQuote(request: QuoteRequest): QuoteResult {
  // 1. Fetch device
  const device = await getDeviceById(request.deviceId);
  if (!device) throw new DeviceNotFoundError(request.deviceId);

  // 2. Validate attributes
  const valid = await validateDeviceAttributes(request.deviceId, request.attributes);
  if (!valid) throw new InvalidAttributesError(request.attributes);

  // 3. Get active policy
  const policy = await getActivePolicy(device.category);

  // 4. Calculate base price with condition
  const conditionMultiplier = getConditionMultiplier(request.condition, policy);
  const afterCondition = device.basePrice * conditionMultiplier;

  // 5. Apply attribute adjustments
  const attributeAdjustment = calculateAttributeAdjustment(request.attributes, device.attributes);
  const afterAttributes = afterCondition + attributeAdjustment;

  // 6. Blend with market anchors
  const { blendedPrice, confidence, warnings, anchors } = await blendWithAnchors(
    device.id,
    request.condition,
    afterAttributes,
    policy
  );

  // 7. Apply policy floor
  const finalPrice = applyPolicyFloor(blendedPrice ?? afterAttributes, policy);
  const policyAdjustment = finalPrice - (blendedPrice ?? afterAttributes);

  // 8. Persist quote
  const quote = await persistQuote({
    deviceId: device.id,
    userId: request.userId,
    condition: request.condition,
    attributes: request.attributes,
    breakdown: { /* ... */ },
    confidence,
    anchorSnapshot: anchors,
    policyId: policy.id,
  });

  return quote;
}
```

### 2.7 Failure Modes

| Failure | Detection | Response |
|---------|-----------|----------|
| Device not found | getDeviceById returns null | Throw DeviceNotFoundError |
| Invalid attributes | validateDeviceAttributes returns false | Throw InvalidAttributesError |
| No active policy | getActivePolicy returns null | Use default policy |
| No approved anchors | blendWithAnchors returns empty | Use policy-only pricing, low confidence |
| Policy floor triggered | finalPrice > blendedPrice | Add warning, log event |

### 2.8 Test Strategy

```typescript
// packages/tech-trade-core/__tests__/pricing-engine.test.ts

describe('Pricing Engine', () => {
  describe('calculateBasePrice', () => {
    it('should apply condition multiplier correctly');
    it('should use 1.0 multiplier for "new" condition');
    it('should use 0.85 multiplier for "excellent" condition');
    it('should use 0.70 multiplier for "good" condition');
    it('should use 0.50 multiplier for "fair" condition');
  });

  describe('applyAttributeAdjustments', () => {
    it('should add positive modifier for higher storage');
    it('should subtract for lower storage');
    it('should add modifier for rare colors');
    it('should subtract for carrier-locked devices');
    it('should handle multiple attributes');
    it('should return 0 for no matching attributes');
  });

  describe('applyPolicyFloor', () => {
    it('should not modify price above floor');
    it('should raise price to absolute floor');
    it('should raise price to margin floor');
    it('should use higher of absolute and margin floor');
  });

  describe('generateQuote', () => {
    it('should produce complete breakdown');
    it('should persist quote to database');
    it('should set 24-hour expiration');
    it('should include anchor snapshot');
    it('should calculate confidence score');
  });
});
```

### 2.9 Performance Requirements

- Quote generation: < 200ms (p95)
- Support 10K quotes/hour sustained

---

## 3. Market Signal Ingestion

### 3.1 Responsibility

Scrape pricing data from external marketplaces (CeX, Back Market), normalize the data, and store as pending market anchors for admin approval.

### 3.2 Inputs

| Input | Type | Source | Description |
|-------|------|--------|-------------|
| Device list | `TechDevice[]` | Database | Active devices to scrape |
| Scraper config | `ScraperConfig` | Environment | Rate limits, credentials |

### 3.3 Outputs

| Output | Type | Description |
|--------|------|-------------|
| Raw anchors | `MarketAnchor[]` | Pending anchors in database |
| Scrape report | `ScrapeReport` | Success/failure counts |

### 3.4 Data Dependencies

```
┌─────────────────┐
│   TechDevice    │
└────────┬────────┘
         │ (lookup by brand/model)
         ▼
┌─────────────────┐      ┌─────────────────┐
│   CeX Website   │      │  Back Market    │
└────────┬────────┘      └────────┬────────┘
         │                        │
         └────────────┬───────────┘
                      ▼
              ┌───────────────┐
              │  MarketAnchor │
              │ (status:      │
              │  pending)     │
              └───────────────┘
```

### 3.5 Interfaces

```typescript
// packages/scraper-sync/scrapers/cex.ts
export interface RawAnchor {
  deviceBrand: string;
  deviceModel: string;
  source: 'cex' | 'back_market';
  condition: Condition;
  price: number;
  currency: string;
  url: string;
  scrapedAt: Date;
}

export interface ScraperConfig {
  rateLimit: number; // requests per minute
  timeout: number; // ms
  retries: number;
  userAgent: string;
}

export interface ScrapeReport {
  source: string;
  startedAt: Date;
  completedAt: Date;
  devicesScraped: number;
  anchorsFound: number;
  errors: { device: string; error: string }[];
}

// Core functions
export async function scrapeCexPrices(devices: TechDevice[], config: ScraperConfig): Promise<RawAnchor[]>;
export async function scrapeBackMarketPrices(devices: TechDevice[], config: ScraperConfig): Promise<RawAnchor[]>;
export async function normalizeAndStoreAnchors(anchors: RawAnchor[]): Promise<number>;
```

### 3.6 Scraping Strategy

```typescript
async function scrapeCexPrices(devices: TechDevice[], config: ScraperConfig): Promise<RawAnchor[]> {
  const anchors: RawAnchor[] = [];
  const rateLimiter = new RateLimiter(config.rateLimit);

  for (const device of devices) {
    await rateLimiter.wait();
    
    try {
      const searchUrl = buildCexSearchUrl(device.brand, device.model);
      const html = await fetchWithRetry(searchUrl, config);
      const prices = parseCexPrices(html);
      
      for (const price of prices) {
        anchors.push({
          deviceBrand: device.brand,
          deviceModel: device.model,
          source: 'cex',
          condition: mapCexCondition(price.grade),
          price: price.sellPrice,
          currency: 'GBP',
          url: price.productUrl,
          scrapedAt: new Date(),
        });
      }
    } catch (error) {
      logScraperError(device, error);
    }
  }

  return anchors;
}
```

### 3.7 Failure Modes

| Failure | Detection | Response |
|---------|-----------|----------|
| Rate limited (429) | HTTP status code | Exponential backoff, retry |
| Page structure changed | Parser returns empty | Alert ops, skip device |
| Network timeout | Request timeout | Retry up to 3 times |
| Device not found on marketplace | No results | Skip, log as expected |
| Invalid price data | Price <= 0 or NaN | Skip, log warning |

### 3.8 Test Strategy

```typescript
// packages/scraper-sync/__tests__/cex.test.ts

describe('CeX Scraper', () => {
  describe('scrapeCexPrices', () => {
    it('should parse valid CeX product page');
    it('should handle rate limiting with backoff');
    it('should skip devices not found');
    it('should normalize condition grades');
    it('should extract all price tiers');
  });

  describe('normalizeAndStoreAnchors', () => {
    it('should match anchors to devices by brand/model');
    it('should create pending MarketAnchor records');
    it('should skip anchors for unknown devices');
    it('should deduplicate anchors from same scrape');
  });
});
```

### 3.9 Performance Requirements

- Scrape 500 devices in < 30 minutes
- Rate limit: 60 requests/minute per source
- Retry timeout: 10 seconds

---

## 4. Anchor Approval Flow

### 4.1 Responsibility

Provide admin interface to review, approve, or reject pending market anchors. Maintain audit trail of all approval decisions. Implement optimistic locking to prevent race conditions.

### 4.2 Inputs

| Input | Type | Source | Description |
|-------|------|--------|-------------|
| Anchor IDs | `string[]` | Admin request | Anchors to approve/reject |
| Action | `'approve' \| 'reject'` | Admin request | Approval decision |
| Admin ID | `string` | Auth context | Who is approving |
| Version | `number` | Request | Optimistic lock version |

### 4.3 Outputs

| Output | Type | Description |
|--------|------|-------------|
| Updated anchors | `MarketAnchor[]` | Anchors with new status |
| Conflict error | `Error` | If version mismatch |
| Audit entries | `AuditLog[]` | Approval audit trail |

### 4.4 Data Dependencies

```
┌─────────────────┐
│  MarketAnchor   │
│ (status:pending)│
└────────┬────────┘
         │ (admin action)
         ▼
┌─────────────────┐
│  MarketAnchor   │
│ (status:approved│
│  or rejected)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    AuditLog     │
└─────────────────┘
```

### 4.5 Interfaces

```typescript
// packages/tech-trade-core/src/anchor-approval.ts

export interface ApprovalRequest {
  anchorIds: string[];
  action: 'approve' | 'reject';
  adminId: string;
  versions: Record<string, number>; // anchorId -> version
}

export interface ApprovalResult {
  approved: string[];
  rejected: string[];
  conflicts: string[];
}

export interface AuditEntry {
  anchorId: string;
  action: 'approve' | 'reject';
  adminId: string;
  timestamp: Date;
  previousStatus: string;
  newStatus: string;
}

// Core functions
export async function approveAnchors(request: ApprovalRequest): Promise<ApprovalResult>;
export async function rejectAnchors(request: ApprovalRequest): Promise<ApprovalResult>;
export async function getPendingAnchors(filters?: AnchorFilters): Promise<MarketAnchor[]>;
export async function getAnchorAuditTrail(anchorId: string): Promise<AuditEntry[]>;
```

### 4.6 Optimistic Locking Implementation

```typescript
async function approveAnchors(request: ApprovalRequest): Promise<ApprovalResult> {
  const result: ApprovalResult = { approved: [], rejected: [], conflicts: [] };

  for (const anchorId of request.anchorIds) {
    const expectedVersion = request.versions[anchorId];
    
    try {
      // Atomic update with version check
      const updated = await prisma.marketAnchor.updateMany({
        where: {
          id: anchorId,
          status: 'pending',
          version: expectedVersion,
        },
        data: {
          status: 'approved',
          approvedAt: new Date(),
          approvedBy: request.adminId,
          version: { increment: 1 },
        },
      });

      if (updated.count === 0) {
        // Version mismatch or already processed
        result.conflicts.push(anchorId);
      } else {
        result.approved.push(anchorId);
        await createAuditEntry(anchorId, 'approve', request.adminId);
      }
    } catch (error) {
      result.conflicts.push(anchorId);
    }
  }

  return result;
}
```

### 4.7 Failure Modes

| Failure | Detection | Response |
|---------|-----------|----------|
| Version conflict | updateMany returns 0 | Return in conflicts array |
| Anchor not found | Query returns null | Return 404 |
| Already processed | Status != pending | Return in conflicts array |
| Unauthorized admin | Auth check fails | Return 403 |

### 4.8 Test Strategy

```typescript
// packages/tech-trade-core/__tests__/anchor-approval.test.ts

describe('Anchor Approval Flow', () => {
  describe('approveAnchors', () => {
    it('should approve pending anchors');
    it('should set approvedAt timestamp');
    it('should set approvedBy admin ID');
    it('should increment version');
    it('should create audit entry');
  });

  describe('optimistic locking', () => {
    it('should detect version conflict');
    it('should not approve if already approved');
    it('should not approve if already rejected');
    it('should handle concurrent approval attempts');
  });

  describe('getPendingAnchors', () => {
    it('should return only pending anchors');
    it('should filter by source');
    it('should filter by device');
    it('should order by scrapedAt DESC');
  });

  describe('getAnchorAuditTrail', () => {
    it('should return all audit entries for anchor');
    it('should order by timestamp DESC');
  });
});
```

### 4.9 Performance Requirements

- Batch approval: < 500ms for 100 anchors
- Pending anchor list: < 200ms

---

## 5. API Gateway (Next.js Routes)

### 5.1 Responsibility

Expose REST endpoints for B2C quote generation, device catalog search, and admin operations. Handle request validation, authentication, and error responses.

### 5.2 Inputs

| Input | Type | Source | Description |
|-------|------|--------|-------------|
| HTTP requests | `Request` | Client | REST API calls |
| Auth token | `string` | Headers | JWT for authenticated routes |

### 5.3 Outputs

| Output | Type | Description |
|--------|------|-------------|
| JSON responses | `Response` | API response with data |
| Error responses | `Response` | Structured error messages |

### 5.4 Route Specifications

#### 5.4.1 `POST /api/tech-trade/quote`

```typescript
// apps/web/app/api/tech-trade/quote/route.ts

import { z } from 'zod';
import { generateQuote } from '@magnus-flipper-ai/tech-trade-core';

const QuoteRequestSchema = z.object({
  deviceId: z.string().uuid(),
  condition: z.enum(['new', 'excellent', 'good', 'fair']),
  attributes: z.record(z.string(), z.string()),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = QuoteRequestSchema.parse(body);
    
    const quote = await generateQuote(validated);
    
    return Response.json(quote, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    if (error instanceof DeviceNotFoundError) {
      return Response.json({ error: 'Device not found' }, { status: 404 });
    }
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

#### 5.4.2 `GET /api/tech-trade/devices`

```typescript
// apps/web/app/api/tech-trade/devices/route.ts

import { z } from 'zod';
import { searchDevices } from '@magnus-flipper-ai/tech-trade-core';

const SearchParamsSchema = z.object({
  q: z.string().optional(),
  brand: z.string().optional(),
  category: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const params = SearchParamsSchema.parse(Object.fromEntries(searchParams));
  
  const result = await searchDevices(params);
  
  return Response.json(result);
}
```

#### 5.4.3 `POST /api/admin/tech-trade/anchors`

```typescript
// apps/web/app/api/admin/tech-trade/anchors/route.ts

import { z } from 'zod';
import { approveAnchors, rejectAnchors } from '@magnus-flipper-ai/tech-trade-core';
import { requireAdmin } from '@/lib/auth';

const ApprovalRequestSchema = z.object({
  anchorIds: z.array(z.string().uuid()),
  action: z.enum(['approve', 'reject']),
  versions: z.record(z.string(), z.number()),
});

export async function POST(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) {
    return Response.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const body = await request.json();
  const validated = ApprovalRequestSchema.parse(body);

  const handler = validated.action === 'approve' ? approveAnchors : rejectAnchors;
  const result = await handler({
    ...validated,
    adminId: admin.id,
  });

  return Response.json(result);
}
```

#### 5.4.4 `GET /api/admin/tech-trade/indicators`

```typescript
// apps/web/app/api/admin/tech-trade/indicators/route.ts

import { getMarketIndicators } from '@magnus-flipper-ai/tech-trade-core';
import { requireAdmin } from '@/lib/auth';

export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) {
    return Response.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const indicators = await getMarketIndicators();
  
  return Response.json(indicators);
}
```

### 5.5 Error Response Format

```typescript
interface ErrorResponse {
  error: string;
  code?: string;
  details?: unknown;
  requestId?: string;
}

// Examples:
{ "error": "Device not found", "code": "DEVICE_NOT_FOUND" }
{ "error": "Validation failed", "code": "VALIDATION_ERROR", "details": [...] }
{ "error": "Quote expired", "code": "QUOTE_EXPIRED" }
{ "error": "Version conflict", "code": "OPTIMISTIC_LOCK_CONFLICT" }
```

### 5.6 Failure Modes

| Failure | Detection | Response |
|---------|-----------|----------|
| Invalid request body | Zod validation fails | 400 with details |
| Unauthorized | Auth check fails | 401 or 403 |
| Resource not found | Service returns null | 404 |
| Rate limited | Rate limiter triggered | 429 with Retry-After |
| Internal error | Uncaught exception | 500 with request ID |

### 5.7 Test Strategy

```typescript
// apps/web/__tests__/api/tech-trade/quote.test.ts

describe('POST /api/tech-trade/quote', () => {
  it('should return 201 with valid quote');
  it('should return 400 for invalid deviceId format');
  it('should return 400 for invalid condition');
  it('should return 404 for non-existent device');
  it('should return 429 when rate limited');
});

describe('GET /api/tech-trade/devices', () => {
  it('should return paginated device list');
  it('should filter by brand');
  it('should filter by category');
  it('should handle fuzzy search');
  it('should respect pagination limits');
});

describe('POST /api/admin/tech-trade/anchors', () => {
  it('should return 403 for non-admin');
  it('should approve anchors successfully');
  it('should reject anchors successfully');
  it('should return conflicts for version mismatch');
});
```

### 5.8 Performance Requirements

- All endpoints: < 200ms (p95)
- Rate limits:
  - Anonymous: 100 requests/hour
  - Authenticated: 1000 requests/hour
  - Admin: 5000 requests/hour

---

## 6. Liquidity Indicators

### 6.1 Responsibility

Compute and expose market health metrics including quote volume, anchor freshness, price confidence, and momentum trends. Support operational monitoring and debugging.

### 6.2 Inputs

| Input | Type | Source | Description |
|-------|------|--------|-------------|
| Time range | `{ start: Date, end: Date }` | Query params | Analysis window |
| Device filter | `string?` | Query params | Filter by device |
| Source filter | `string?` | Query params | Filter by anchor source |

### 6.3 Outputs

| Output | Type | Description |
|--------|------|-------------|
| Volume metrics | `VolumeMetrics` | Quote counts by period |
| Anchor metrics | `AnchorMetrics` | Anchor status breakdown |
| Confidence score | `ConfidenceMetrics` | Overall and per-source confidence |
| Momentum | `MomentumMetrics` | Price trend direction |

### 6.4 Data Dependencies

```
┌─────────────────┐      ┌─────────────────┐
│  DeviceQuote    │      │  MarketAnchor   │
└────────┬────────┘      └────────┬────────┘
         │                        │
         └────────────┬───────────┘
                      ▼
              ┌───────────────┐
              │   Indicators  │
              │   Aggregator  │
              └───────────────┘
```

### 6.5 Interfaces

```typescript
// packages/tech-trade-core/src/market-indicators.ts

export interface VolumeMetrics {
  quotesToday: number;
  quotesThisWeek: number;
  quotesThisMonth: number;
  quotesByDay: { date: string; count: number }[];
}

export interface AnchorMetrics {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  stale: number;
  bySource: Record<string, { total: number; approved: number; stale: number }>;
}

export interface ConfidenceMetrics {
  overall: number; // 0.0 - 1.0
  bySource: Record<string, number>;
  factors: {
    freshness: number;
    sourceAgreement: number;
    coverage: number;
  };
}

export interface MomentumMetrics {
  trend: 'up' | 'down' | 'stable';
  percentChange7d: number;
  percentChange30d: number;
  priceHistory: { date: string; avgPrice: number }[];
}

export interface MarketIndicators {
  volume: VolumeMetrics;
  anchors: AnchorMetrics;
  confidence: ConfidenceMetrics;
  momentum: MomentumMetrics;
  generatedAt: Date;
}

// Core functions
export async function getMarketIndicators(filters?: IndicatorFilters): Promise<MarketIndicators>;
export async function calculateConfidence(deviceId: string): Promise<number>;
export async function calculateMomentum(deviceId: string, days: number): Promise<MomentumMetrics>;
```

### 6.6 Calculation Logic

```typescript
async function calculateConfidence(deviceId: string): Promise<number> {
  const anchors = await getApprovedAnchors(deviceId);
  const policy = await getActivePolicy();
  
  if (anchors.length === 0) return 0;

  // Freshness: % of anchors within max age
  const freshAnchors = anchors.filter(a => 
    daysSince(a.scrapedAt) <= policy.anchorMaxAgeDays
  );
  const freshness = freshAnchors.length / anchors.length;

  // Source agreement: inverse of coefficient of variation
  const prices = anchors.map(a => a.price);
  const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
  const stdDev = Math.sqrt(
    prices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / prices.length
  );
  const cv = stdDev / mean;
  const sourceAgreement = Math.max(0, 1 - cv);

  // Coverage: % of sources with data
  const sources = new Set(anchors.map(a => a.source));
  const expectedSources = ['cex', 'back_market'];
  const coverage = sources.size / expectedSources.length;

  // Weighted average
  return (freshness * 0.4) + (sourceAgreement * 0.4) + (coverage * 0.2);
}

async function calculateMomentum(deviceId: string, days: number = 7): Promise<MomentumMetrics> {
  const currentAnchors = await getAnchorsInRange(deviceId, daysAgo(days), now());
  const previousAnchors = await getAnchorsInRange(deviceId, daysAgo(days * 2), daysAgo(days));

  const currentAvg = average(currentAnchors.map(a => a.price));
  const previousAvg = average(previousAnchors.map(a => a.price));

  const percentChange = ((currentAvg - previousAvg) / previousAvg) * 100;

  let trend: 'up' | 'down' | 'stable';
  if (percentChange > 5) trend = 'up';
  else if (percentChange < -5) trend = 'down';
  else trend = 'stable';

  return {
    trend,
    percentChange7d: percentChange,
    percentChange30d: await calculate30dChange(deviceId),
    priceHistory: await getPriceHistory(deviceId, days),
  };
}
```

### 6.7 Failure Modes

| Failure | Detection | Response |
|---------|-----------|----------|
| No quote data | Empty results | Return zeros, flag in response |
| No anchor data | Empty results | Return 0 confidence |
| Calculation error | Division by zero | Handle gracefully, return null |
| Stale cache | TTL expired | Recalculate on demand |

### 6.8 Test Strategy

```typescript
// packages/tech-trade-core/__tests__/market-indicators.test.ts

describe('Market Indicators', () => {
  describe('VolumeMetrics', () => {
    it('should count quotes in last 24 hours');
    it('should count quotes in last 7 days');
    it('should count quotes in last 30 days');
    it('should group quotes by day');
    it('should return zeros when no quotes');
  });

  describe('calculateConfidence', () => {
    it('should return 1.0 for fresh, agreeing anchors');
    it('should penalize stale anchors');
    it('should penalize disagreeing prices');
    it('should penalize missing sources');
    it('should return 0 for no anchors');
  });

  describe('calculateMomentum', () => {
    it('should detect upward trend (> +5%)');
    it('should detect downward trend (< -5%)');
    it('should detect stable trend (±5%)');
    it('should calculate 7-day percent change');
    it('should handle missing historical data');
  });

  describe('getMarketIndicators', () => {
    it('should aggregate all metrics');
    it('should filter by device');
    it('should filter by source');
    it('should include generation timestamp');
  });
});
```

### 6.9 Performance Requirements

- Full indicator calculation: < 500ms
- Cached response: < 50ms
- Cache TTL: 5 minutes

---

## Summary

| Subsystem | Primary File | Key Functions | Test File |
|-----------|--------------|---------------|-----------|
| Device Catalog | `device-catalog.ts` | `searchDevices`, `getDeviceById` | `device-catalog.test.ts` |
| Pricing Engine | `pricing-engine.ts` | `generateQuote`, `calculateBasePrice` | `pricing-engine.test.ts` |
| Market Signal Ingestion | `scrapers/cex.ts` | `scrapeCexPrices`, `normalizeAndStoreAnchors` | `cex.test.ts` |
| Anchor Approval | `anchor-approval.ts` | `approveAnchors`, `getPendingAnchors` | `anchor-approval.test.ts` |
| API Gateway | `app/api/tech-trade/*` | Route handlers | `api/*.test.ts` |
| Liquidity Indicators | `market-indicators.ts` | `getMarketIndicators`, `calculateConfidence` | `market-indicators.test.ts` |

---

**Document Status:** Ready for Sprint Planning (Phase 4)

