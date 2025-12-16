# Magnus Tech Trade - Adversarial Design Review

**Reviewer Role:** Principal Engineer (hostile but fair)  
**Review Date:** 2025-12-16  
**Document Reviewed:** TECHNICAL_DESIGN.md v1.0

---

## Executive Summary

The Technical Design Document presents a reasonable approach to building a tech device pricing engine. However, several critical issues need addressing before implementation proceeds. This review identifies **3 blocking issues**, **5 major risks**, and **8 recommendations**.

**Verdict:** Proceed with modifications. Address blocking issues before Sprint 1.

---

## 1. Blocking Issues (Must Fix)

### 1.1 Race Condition in Anchor Approval

**Problem:** The design does not address concurrent anchor approval. If two admins approve/reject the same anchor simultaneously, or if a pricing calculation reads an anchor mid-approval, data inconsistency occurs.

**Scenario:**
```
T0: Admin A loads anchor #123 (status: pending)
T1: Admin B loads anchor #123 (status: pending)
T2: Admin A approves anchor #123
T3: Admin B rejects anchor #123 (overwrites approval!)
```

**Required Fix:**
- Add optimistic locking with version field
- Use database transactions for status transitions
- Add `version` column to MarketAnchor model

```prisma
model MarketAnchor {
  // ... existing fields
  version Int @default(0) // Optimistic locking
}
```

### 1.2 Missing Quote Expiration Enforcement

**Problem:** The design mentions `expiresAt` but doesn't specify how expired quotes are handled. Users could accept expired quotes, leading to pricing discrepancies.

**Required Fix:**
- Add server-side expiration check before quote acceptance
- Add database constraint or trigger to prevent accepting expired quotes
- Define quote TTL (recommend: 24 hours)

```typescript
// In quote acceptance handler
if (quote.expiresAt < new Date()) {
  throw new QuoteExpiredError(quote.id);
}
```

### 1.3 No Audit Trail for Pricing Decisions

**Problem:** When a bad quote is generated, there's no way to reconstruct why. The design stores final prices but not the inputs used to calculate them.

**Required Fix:**
- Store snapshot of anchors used in quote calculation
- Add `anchorSnapshot` JSON field to DeviceQuote
- Log policy version used

```prisma
model DeviceQuote {
  // ... existing fields
  anchorSnapshot Json? @map("anchor_snapshot") // Anchors used at quote time
  policyId       String? @map("policy_id") @db.Uuid // Policy version used
}
```

---

## 2. Major Risks

### 2.1 Scalability: Pricing Engine Performance

**Risk Level:** HIGH

**Concern:** The design claims < 200ms p95 response time but doesn't address:
- Database query complexity (multiple JOINs for device + attributes + anchors + policy)
- No caching strategy for hot paths
- No connection pooling specification

**Analysis:**
```
Worst case query path:
1. Fetch TechDevice by ID (1 query)
2. Fetch DeviceAttributes for device (1 query)
3. Fetch approved MarketAnchors for device (1 query)
4. Fetch active PricingPolicy (1 query)
5. Insert DeviceQuote (1 write)
Total: 4 reads + 1 write = 5 DB operations
```

**Recommendation:**
- Add composite query to fetch device + attributes + anchors in single query
- Implement Redis cache for PricingPolicy (rarely changes)
- Add database indexes specified in schema (already present, good)
- Target: 3 DB operations max per quote

### 2.2 Data Consistency: Anchor Staleness Window

**Risk Level:** MEDIUM

**Concern:** The 7-day staleness window is arbitrary. Tech device prices can shift significantly in 7 days (e.g., new model announcement).

**Questions:**
- What happens during iPhone launch week when prices drop 20% overnight?
- How do we handle flash sales on CeX/Back Market?

**Recommendation:**
- Add per-category staleness configuration
- Implement "price shock" detection (> 10% change triggers re-scrape)
- Consider 3-day window for smartphones, 7-day for laptops

### 2.3 Security: Quote Manipulation via Attribute Injection

**Risk Level:** MEDIUM

**Concern:** The `attributes` field in quote requests is a JSON object. Malicious users could:
- Submit invalid attribute combinations
- Attempt to inject attributes that don't exist for a device
- Submit conflicting attributes (e.g., two storage values)

**Recommendation:**
- Validate attributes against DeviceAttribute table
- Whitelist allowed attribute types per device
- Add request schema validation with Zod

```typescript
const QuoteRequestSchema = z.object({
  deviceId: z.string().uuid(),
  condition: z.enum(['new', 'excellent', 'good', 'fair']),
  attributes: z.record(z.string()).refine(
    (attrs) => validateAttributesForDevice(attrs, deviceId)
  )
});
```

### 2.4 Operational: No Rollback Mechanism for Bad Anchors

**Risk Level:** MEDIUM

**Concern:** If bad anchor data is approved and used in quotes, there's no mechanism to:
- Identify affected quotes
- Notify affected users
- Rollback to previous good state

**Recommendation:**
- Add `anchorBatchId` to group anchors from same scrape run
- Implement "anchor recall" feature to mark batch as invalid
- Add webhook/notification for users with affected pending quotes

### 2.5 Business: Device Catalog Maintenance Burden

**Risk Level:** MEDIUM

**Concern:** The design assumes manual device catalog population but doesn't address:
- Who maintains the catalog?
- How often are new devices added?
- What's the SLA for adding new releases?

**Recommendation:**
- Define catalog maintenance process
- Consider semi-automated catalog expansion from scraper data
- Add "unknown device" logging with frequency tracking

---

## 3. Missing Assumptions

### 3.1 Device Depreciation Over Time

**Gap:** The design uses static `basePrice` but tech devices depreciate continuously, not just at condition boundaries.

**Recommendation:** Add depreciation curve support in future sprint:
```typescript
function getDepreciatedBasePrice(device: TechDevice): number {
  const ageMonths = monthsSince(device.releaseYear);
  const depreciationRate = 0.02; // 2% per month
  return device.basePrice * Math.pow(1 - depreciationRate, ageMonths);
}
```

### 3.2 Regional Pricing Differences

**Gap:** UK-only is stated as non-goal, but no migration path for internationalization.

**Recommendation:** Add `currency` field to models now to avoid schema migration later:
```prisma
model TechDevice {
  // ... existing
  currency String @default("GBP")
}
```

### 3.3 Tax Implications

**Gap:** No mention of VAT handling. Are prices inclusive or exclusive?

**Recommendation:** Document VAT policy. Recommend all prices be VAT-inclusive for B2C.

### 3.4 Device Variants (Carrier Models)

**Gap:** Some devices have carrier-specific models (e.g., iPhone 13 A2633 vs A2634). These may have different values.

**Recommendation:** Add optional `variant` field to TechDevice for model number specificity.

---

## 4. Scalability Bottlenecks

### 4.1 Anchor Table Growth

**Projection:**
- 500 devices × 4 conditions × 2 sources × 365 days = 1.46M anchors/year
- With history retention, table grows unbounded

**Recommendation:**
- Add anchor archival policy (archive approved anchors > 30 days)
- Partition table by `scrapedAt` month
- Add index on `(deviceId, status, scrapedAt DESC)` for efficient latest-anchor queries

### 4.2 Quote Table Growth

**Projection:**
- 10K quotes/day = 3.65M quotes/year
- With full breakdown storage, significant storage cost

**Recommendation:**
- Archive accepted/expired quotes to cold storage after 90 days
- Consider quote summary table for analytics (aggregated, not per-quote)

### 4.3 Single Pricing Policy Lookup

**Current:** Every quote fetches active PricingPolicy from database.

**Recommendation:**
- Cache policy in memory with 5-minute TTL
- Invalidate cache on policy update
- Add policy version to cache key

---

## 5. Security Concerns

### 5.1 Rate Limiting Not Specified

**Risk:** Malicious actors could:
- Scrape pricing data via quote API
- DDoS the pricing engine
- Enumerate device catalog

**Recommendation:**
- Add rate limiting: 100 quotes/hour per IP (anonymous), 1000/hour (authenticated)
- Add CAPTCHA for anonymous quote requests
- Log and alert on suspicious patterns

### 5.2 Admin Endpoint Authorization

**Risk:** Admin endpoints (`/api/admin/tech-trade/*`) need proper authorization.

**Recommendation:**
- Verify admin role before processing
- Add audit logging for all admin actions
- Implement principle of least privilege (separate roles for view vs approve)

### 5.3 Scraper Abuse Detection

**Risk:** If scrapers are detected and blocked, pricing becomes stale.

**Recommendation:**
- Implement scraper health monitoring
- Add fallback data sources
- Alert on scraper failure > 24 hours

---

## 6. Operational Blind Spots

### 6.1 No Monitoring/Alerting Specification

**Gap:** Design doesn't specify what to monitor.

**Recommendation:** Add monitoring for:
- Quote generation latency (p50, p95, p99)
- Quote volume (hourly, daily)
- Anchor freshness (% stale by source)
- Scraper success rate
- Error rates by endpoint

### 6.2 No Debugging Playbook

**Gap:** How does on-call debug a "bad quote" complaint?

**Recommendation:** Create runbook with:
1. Fetch quote by ID with full breakdown
2. Fetch anchor snapshot used
3. Fetch policy version used
4. Replay calculation with logged inputs
5. Compare with current calculation

### 6.3 No Feature Flags

**Gap:** No mechanism to disable features in production.

**Recommendation:** Add feature flags for:
- `tech_trade_enabled`: Kill switch for entire feature
- `anchor_blending_enabled`: Fall back to policy-only
- `cex_scraper_enabled`: Disable individual scrapers

---

## 7. Required Changes Summary

### Blocking (Must Fix Before Sprint 1)

| ID | Issue | Fix |
|----|-------|-----|
| B1 | Race condition in anchor approval | Add optimistic locking |
| B2 | Quote expiration not enforced | Add server-side check |
| B3 | No audit trail for pricing | Store anchor snapshot |

### High Priority (Fix in Sprint 1)

| ID | Issue | Fix |
|----|-------|-----|
| H1 | Scalability concerns | Add caching, optimize queries |
| H2 | Attribute validation | Add Zod schema validation |
| H3 | Rate limiting | Implement per-IP limits |

### Medium Priority (Fix by Sprint 2)

| ID | Issue | Fix |
|----|-------|-----|
| M1 | Anchor rollback mechanism | Add batch tracking |
| M2 | Monitoring specification | Define metrics |
| M3 | Feature flags | Add kill switches |

### Low Priority (Backlog)

| ID | Issue | Fix |
|----|-------|-----|
| L1 | Depreciation curves | Future sprint |
| L2 | Regional pricing | Add currency field |
| L3 | Anchor archival | Implement after 6 months |

---

## 8. Recommendations for TDD

### 8.1 Add to Data Models

```prisma
model MarketAnchor {
  // Add optimistic locking
  version Int @default(0)
}

model DeviceQuote {
  // Add audit fields
  anchorSnapshot Json? @map("anchor_snapshot")
  policyId       String? @map("policy_id") @db.Uuid
}

model TechDevice {
  // Future-proof for i18n
  currency String @default("GBP")
}
```

### 8.2 Add to API Specification

```typescript
// Quote acceptance must check expiration
POST /api/tech-trade/quote/:id/accept
- Returns 410 Gone if quote expired
- Returns 409 Conflict if quote already accepted/rejected

// Anchor approval must use optimistic locking
POST /api/admin/tech-trade/anchors
- Request includes `version` field
- Returns 409 Conflict if version mismatch
```

### 8.3 Add to Test Strategy

- Unit test: Concurrent anchor approval (expect conflict)
- Unit test: Expired quote acceptance (expect rejection)
- Integration test: Full audit trail reconstruction
- Load test: 10K quotes/hour sustained

---

## Conclusion

The design is fundamentally sound but has critical gaps in concurrency handling, audit trails, and operational readiness. The blocking issues are straightforward to fix and should be addressed before implementation begins.

The pricing strategy is reasonable for an MVP. The 40/40/20 anchor blending weights are arbitrary but acceptable as starting points—recommend A/B testing in production to optimize.

**Next Steps:**
1. Update TDD with blocking fixes
2. Add monitoring specification
3. Create debugging runbook
4. Proceed to Phase 3 (Subsystem Specs)

---

**Reviewer Sign-off:** Design approved with modifications  
**Date:** 2025-12-16

