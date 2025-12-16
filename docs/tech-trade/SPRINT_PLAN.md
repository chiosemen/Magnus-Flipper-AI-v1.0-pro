# Magnus Tech Trade - Sprint Plan & Backlog

**Version:** 1.0  
**Author:** Senior TPM  
**Date:** 2025-12-16  
**Team:** 1-2 Senior Engineers + AI Agents

---

## Executive Summary

This document outlines the 4-sprint execution plan for Magnus Tech Trade. Each sprint is 1 week, with clear deliverables and acceptance criteria. Risk reduction is prioritized: core pricing engine before market signals, B2C before B2B.

**Timeline:** 4 weeks (Sprints 1-4)  
**Total Story Points:** 89 points  
**Velocity Assumption:** 20-25 points/sprint

---

## Sprint Overview

| Sprint | Theme | Duration | Key Deliverables |
|--------|-------|----------|------------------|
| 1 | Core Engine | Week 1 | Pricing engine, device catalog, schema |
| 2 | B2C Quote Flow | Week 2 | API routes, quote persistence |
| 3 | Market Signals | Week 3 | Scrapers, anchor blending |
| 4 | Admin & Indicators | Week 4 | Admin UI, liquidity dashboard |

---

## Sprint 1: Core Engine Foundation

**Theme:** Build the deterministic pricing engine with full test coverage  
**Sprint Goal:** Generate accurate quotes from device + condition + attributes (no market anchors yet)

### Epic 1.1: Database Schema

| ID | Story | Points | Acceptance Criteria |
|----|-------|--------|---------------------|
| S1.1.1 | Add TechDevice model to Prisma schema | 2 | Model created with all fields, indexes defined |
| S1.1.2 | Add DeviceAttribute model | 2 | Relationship to TechDevice established |
| S1.1.3 | Add MarketAnchor model with optimistic locking | 3 | Version field included, indexes on status/source |
| S1.1.4 | Add DeviceQuote model with audit fields | 3 | anchorSnapshot and policyId fields included |
| S1.1.5 | Add PricingPolicy model | 2 | Default policy values set |
| S1.1.6 | Run migration and verify schema | 1 | Migration successful, no errors |

**Subtotal:** 13 points

### Epic 1.2: Package Setup

| ID | Story | Points | Acceptance Criteria |
|----|-------|--------|---------------------|
| S1.2.1 | Create packages/tech-trade-core structure | 2 | package.json, tsconfig.json, vitest.config.ts |
| S1.2.2 | Configure workspace dependency on @magnus-flipper-ai/core | 1 | Import from core/db works |
| S1.2.3 | Set up test fixtures | 2 | Device, attribute, policy fixtures created |

**Subtotal:** 5 points

### Epic 1.3: Device Catalog

| ID | Story | Points | Acceptance Criteria |
|----|-------|--------|---------------------|
| S1.3.1 | Implement searchDevices function | 3 | Fuzzy search, pagination, filters work |
| S1.3.2 | Implement getDeviceById function | 2 | Returns device with attributes |
| S1.3.3 | Implement validateDeviceAttributes function | 2 | Validates attribute combinations |
| S1.3.4 | Write unit tests for device catalog | 3 | 100% coverage, edge cases |

**Subtotal:** 10 points

### Epic 1.4: Pricing Engine Core

| ID | Story | Points | Acceptance Criteria |
|----|-------|--------|---------------------|
| S1.4.1 | Implement calculateBasePrice with condition multipliers | 3 | All 4 conditions work correctly |
| S1.4.2 | Implement applyAttributeAdjustments | 3 | Storage, color, carrier adjustments |
| S1.4.3 | Implement applyPolicyFloor | 2 | Absolute and margin floors enforced |
| S1.4.4 | Write unit tests for pricing engine | 5 | TDD: tests written first, all passing |

**Subtotal:** 13 points

### Sprint 1 Total: 41 points

### Sprint 1 Tasks Breakdown

```
Week 1 Day 1-2: Schema & Package Setup
├── [ ] Create migration for tech trade models
├── [ ] Run prisma generate
├── [ ] Create packages/tech-trade-core directory
├── [ ] Configure package.json with dependencies
├── [ ] Set up vitest.config.ts
└── [ ] Create test fixtures

Week 1 Day 3-4: Device Catalog
├── [ ] Write device-catalog.test.ts (TDD)
├── [ ] Implement device-catalog.ts
├── [ ] Verify all tests pass
└── [ ] Add types.ts with interfaces

Week 1 Day 5: Pricing Engine
├── [ ] Write pricing-engine.test.ts (TDD)
├── [ ] Implement pricing-engine.ts
├── [ ] Implement policy-enforcement.ts
└── [ ] Verify all tests pass
```

---

## Sprint 2: B2C Quote Flow

**Theme:** Enable users to get instant quotes via API  
**Sprint Goal:** Complete quote generation flow with persistence and expiration

### Epic 2.1: Quote API Route

| ID | Story | Points | Acceptance Criteria |
|----|-------|--------|---------------------|
| S2.1.1 | Create POST /api/tech-trade/quote route | 3 | Accepts request, returns quote |
| S2.1.2 | Add Zod schema validation | 2 | Invalid requests return 400 |
| S2.1.3 | Implement error handling | 2 | 404 for device not found, 500 for errors |
| S2.1.4 | Add rate limiting | 2 | 100 req/hour anonymous, 1000 authenticated |

**Subtotal:** 9 points

### Epic 2.2: Device Search API

| ID | Story | Points | Acceptance Criteria |
|----|-------|--------|---------------------|
| S2.2.1 | Create GET /api/tech-trade/devices route | 2 | Returns paginated device list |
| S2.2.2 | Add query parameter validation | 1 | Validates page, limit, filters |
| S2.2.3 | Implement fuzzy search | 2 | Typo tolerance works |

**Subtotal:** 5 points

### Epic 2.3: Quote Persistence

| ID | Story | Points | Acceptance Criteria |
|----|-------|--------|---------------------|
| S2.3.1 | Implement quote persistence in generateQuote | 3 | Quote saved to database |
| S2.3.2 | Add 24-hour expiration logic | 2 | expiresAt set correctly |
| S2.3.3 | Implement quote status transitions | 2 | pending → accepted/expired/rejected |
| S2.3.4 | Add quote lookup endpoint | 2 | GET /api/tech-trade/quote/:id |

**Subtotal:** 9 points

### Epic 2.4: Integration Tests

| ID | Story | Points | Acceptance Criteria |
|----|-------|--------|---------------------|
| S2.4.1 | Write quote flow integration tests | 3 | End-to-end quote generation |
| S2.4.2 | Write device search integration tests | 2 | Search with various filters |
| S2.4.3 | Write expiration integration tests | 2 | Expired quotes rejected |

**Subtotal:** 7 points

### Sprint 2 Total: 30 points

### Sprint 2 Tasks Breakdown

```
Week 2 Day 1-2: API Routes
├── [ ] Create app/api/tech-trade/quote/route.ts
├── [ ] Create app/api/tech-trade/devices/route.ts
├── [ ] Add Zod schemas for validation
├── [ ] Implement rate limiting middleware
└── [ ] Write API route tests

Week 2 Day 3-4: Quote Persistence
├── [ ] Update generateQuote to persist
├── [ ] Add expiration logic
├── [ ] Create quote status enum
├── [ ] Add GET /api/tech-trade/quote/:id
└── [ ] Write persistence tests

Week 2 Day 5: Integration Tests
├── [ ] Write quote-flow.integration.test.ts
├── [ ] Write device-search.integration.test.ts
├── [ ] Run full integration test suite
└── [ ] Fix any failing tests
```

---

## Sprint 3: Market Signal Ingestion

**Theme:** Integrate real-time market pricing from CeX and Back Market  
**Sprint Goal:** Scrapers running, anchors stored, blending in pricing engine

### Epic 3.1: CeX Scraper

| ID | Story | Points | Acceptance Criteria |
|----|-------|--------|---------------------|
| S3.1.1 | Implement CeX price scraper | 5 | Extracts prices for all conditions |
| S3.1.2 | Add rate limiting and retry logic | 2 | Handles 429, timeouts |
| S3.1.3 | Implement condition grade mapping | 2 | CeX grades → our conditions |
| S3.1.4 | Write scraper tests | 3 | Mocked HTML parsing tests |

**Subtotal:** 12 points

### Epic 3.2: Back Market Scraper

| ID | Story | Points | Acceptance Criteria |
|----|-------|--------|---------------------|
| S3.2.1 | Implement Back Market price scraper | 5 | Extracts refurbished prices |
| S3.2.2 | Add rate limiting and retry logic | 2 | Handles errors gracefully |
| S3.2.3 | Implement condition mapping | 2 | Back Market grades → our conditions |
| S3.2.4 | Write scraper tests | 3 | Mocked HTML parsing tests |

**Subtotal:** 12 points

### Epic 3.3: Anchor Storage & Blending

| ID | Story | Points | Acceptance Criteria |
|----|-------|--------|---------------------|
| S3.3.1 | Implement normalizeAndStoreAnchors | 3 | Matches to devices, stores pending |
| S3.3.2 | Implement anchor-blending.ts | 3 | 40/40/20 weighting works |
| S3.3.3 | Update generateQuote to use anchors | 2 | Blended price in breakdown |
| S3.3.4 | Handle missing/stale anchors | 2 | Fallback to policy-only |
| S3.3.5 | Write anchor blending tests | 3 | All weighting scenarios |

**Subtotal:** 13 points

### Epic 3.4: Worker Job

| ID | Story | Points | Acceptance Criteria |
|----|-------|--------|---------------------|
| S3.4.1 | Create market-anchors.ts job | 3 | Runs daily at 6 AM |
| S3.4.2 | Add scrape report logging | 1 | Success/failure counts logged |

**Subtotal:** 4 points

### Sprint 3 Total: 41 points

### Sprint 3 Tasks Breakdown

```
Week 3 Day 1-2: CeX Scraper
├── [ ] Analyze CeX website structure
├── [ ] Implement scrapeCexPrices
├── [ ] Add rate limiting
├── [ ] Map condition grades
└── [ ] Write scraper tests

Week 3 Day 3-4: Back Market Scraper + Blending
├── [ ] Analyze Back Market structure
├── [ ] Implement scrapeBackMarketPrices
├── [ ] Implement anchor-blending.ts
├── [ ] Update generateQuote
└── [ ] Write blending tests

Week 3 Day 5: Worker Job + Integration
├── [ ] Create market-anchors.ts job
├── [ ] Test full scrape → store → blend flow
├── [ ] Write integration tests
└── [ ] Verify pricing with real anchors
```

---

## Sprint 4: Admin Tools & Liquidity Indicators

**Theme:** Enable operations team to manage anchors and monitor market health  
**Sprint Goal:** Admin can approve anchors, view liquidity dashboard

### Epic 4.1: Anchor Approval Flow

| ID | Story | Points | Acceptance Criteria |
|----|-------|--------|---------------------|
| S4.1.1 | Implement getPendingAnchors | 2 | Returns filtered pending anchors |
| S4.1.2 | Implement approveAnchors with optimistic locking | 3 | Version conflicts detected |
| S4.1.3 | Implement rejectAnchors | 2 | Status updated, audit logged |
| S4.1.4 | Create POST /api/admin/tech-trade/anchors route | 2 | Admin-only, validates request |
| S4.1.5 | Write anchor approval tests | 3 | Concurrent approval tests |

**Subtotal:** 12 points

### Epic 4.2: Liquidity Indicators

| ID | Story | Points | Acceptance Criteria |
|----|-------|--------|---------------------|
| S4.2.1 | Implement quote volume metrics | 2 | Daily/weekly/monthly counts |
| S4.2.2 | Implement anchor freshness metrics | 2 | Stale count, by-source breakdown |
| S4.2.3 | Implement calculateConfidence | 3 | Freshness + agreement + coverage |
| S4.2.4 | Implement calculateMomentum | 3 | 7-day trend detection |
| S4.2.5 | Create GET /api/admin/tech-trade/indicators route | 2 | Returns all metrics |
| S4.2.6 | Write indicator tests | 3 | All calculation scenarios |

**Subtotal:** 15 points

### Epic 4.3: Admin UI (Basic)

| ID | Story | Points | Acceptance Criteria |
|----|-------|--------|---------------------|
| S4.3.1 | Create anchor approval table component | 3 | Lists pending anchors |
| S4.3.2 | Add approve/reject buttons | 2 | Calls API, handles conflicts |
| S4.3.3 | Create indicators dashboard component | 3 | Displays all metrics |

**Subtotal:** 8 points

### Sprint 4 Total: 35 points

### Sprint 4 Tasks Breakdown

```
Week 4 Day 1-2: Anchor Approval
├── [ ] Implement anchor-approval.ts
├── [ ] Add optimistic locking
├── [ ] Create admin API route
├── [ ] Write approval tests
└── [ ] Test concurrent scenarios

Week 4 Day 3-4: Liquidity Indicators
├── [ ] Implement market-indicators.ts
├── [ ] Add volume calculations
├── [ ] Add confidence calculations
├── [ ] Add momentum calculations
└── [ ] Write indicator tests

Week 4 Day 5: Admin UI + Final Integration
├── [ ] Create anchor approval UI
├── [ ] Create indicators dashboard
├── [ ] Run full system integration tests
└── [ ] Final documentation
```

---

## Full Backlog Table

| ID | Epic | Story | Points | Sprint | Status |
|----|------|-------|--------|--------|--------|
| S1.1.1 | Schema | Add TechDevice model | 2 | 1 | Pending |
| S1.1.2 | Schema | Add DeviceAttribute model | 2 | 1 | Pending |
| S1.1.3 | Schema | Add MarketAnchor model | 3 | 1 | Pending |
| S1.1.4 | Schema | Add DeviceQuote model | 3 | 1 | Pending |
| S1.1.5 | Schema | Add PricingPolicy model | 2 | 1 | Pending |
| S1.1.6 | Schema | Run migration | 1 | 1 | Pending |
| S1.2.1 | Setup | Create package structure | 2 | 1 | Pending |
| S1.2.2 | Setup | Configure workspace deps | 1 | 1 | Pending |
| S1.2.3 | Setup | Set up test fixtures | 2 | 1 | Pending |
| S1.3.1 | Catalog | Implement searchDevices | 3 | 1 | Pending |
| S1.3.2 | Catalog | Implement getDeviceById | 2 | 1 | Pending |
| S1.3.3 | Catalog | Implement validateDeviceAttributes | 2 | 1 | Pending |
| S1.3.4 | Catalog | Write catalog tests | 3 | 1 | Pending |
| S1.4.1 | Pricing | Implement calculateBasePrice | 3 | 1 | Pending |
| S1.4.2 | Pricing | Implement applyAttributeAdjustments | 3 | 1 | Pending |
| S1.4.3 | Pricing | Implement applyPolicyFloor | 2 | 1 | Pending |
| S1.4.4 | Pricing | Write pricing tests | 5 | 1 | Pending |
| S2.1.1 | Quote API | Create quote route | 3 | 2 | Pending |
| S2.1.2 | Quote API | Add Zod validation | 2 | 2 | Pending |
| S2.1.3 | Quote API | Implement error handling | 2 | 2 | Pending |
| S2.1.4 | Quote API | Add rate limiting | 2 | 2 | Pending |
| S2.2.1 | Device API | Create devices route | 2 | 2 | Pending |
| S2.2.2 | Device API | Add query validation | 1 | 2 | Pending |
| S2.2.3 | Device API | Implement fuzzy search | 2 | 2 | Pending |
| S2.3.1 | Persistence | Implement quote persistence | 3 | 2 | Pending |
| S2.3.2 | Persistence | Add expiration logic | 2 | 2 | Pending |
| S2.3.3 | Persistence | Implement status transitions | 2 | 2 | Pending |
| S2.3.4 | Persistence | Add quote lookup endpoint | 2 | 2 | Pending |
| S2.4.1 | Integration | Write quote flow tests | 3 | 2 | Pending |
| S2.4.2 | Integration | Write device search tests | 2 | 2 | Pending |
| S2.4.3 | Integration | Write expiration tests | 2 | 2 | Pending |
| S3.1.1 | CeX | Implement scraper | 5 | 3 | Pending |
| S3.1.2 | CeX | Add rate limiting | 2 | 3 | Pending |
| S3.1.3 | CeX | Implement condition mapping | 2 | 3 | Pending |
| S3.1.4 | CeX | Write scraper tests | 3 | 3 | Pending |
| S3.2.1 | Back Market | Implement scraper | 5 | 3 | Pending |
| S3.2.2 | Back Market | Add rate limiting | 2 | 3 | Pending |
| S3.2.3 | Back Market | Implement condition mapping | 2 | 3 | Pending |
| S3.2.4 | Back Market | Write scraper tests | 3 | 3 | Pending |
| S3.3.1 | Blending | Implement normalizeAndStoreAnchors | 3 | 3 | Pending |
| S3.3.2 | Blending | Implement anchor-blending.ts | 3 | 3 | Pending |
| S3.3.3 | Blending | Update generateQuote | 2 | 3 | Pending |
| S3.3.4 | Blending | Handle missing/stale anchors | 2 | 3 | Pending |
| S3.3.5 | Blending | Write blending tests | 3 | 3 | Pending |
| S3.4.1 | Worker | Create market-anchors job | 3 | 3 | Pending |
| S3.4.2 | Worker | Add scrape report logging | 1 | 3 | Pending |
| S4.1.1 | Approval | Implement getPendingAnchors | 2 | 4 | Pending |
| S4.1.2 | Approval | Implement approveAnchors | 3 | 4 | Pending |
| S4.1.3 | Approval | Implement rejectAnchors | 2 | 4 | Pending |
| S4.1.4 | Approval | Create admin anchors route | 2 | 4 | Pending |
| S4.1.5 | Approval | Write approval tests | 3 | 4 | Pending |
| S4.2.1 | Indicators | Implement volume metrics | 2 | 4 | Pending |
| S4.2.2 | Indicators | Implement freshness metrics | 2 | 4 | Pending |
| S4.2.3 | Indicators | Implement calculateConfidence | 3 | 4 | Pending |
| S4.2.4 | Indicators | Implement calculateMomentum | 3 | 4 | Pending |
| S4.2.5 | Indicators | Create indicators route | 2 | 4 | Pending |
| S4.2.6 | Indicators | Write indicator tests | 3 | 4 | Pending |
| S4.3.1 | Admin UI | Create anchor table | 3 | 4 | Pending |
| S4.3.2 | Admin UI | Add approve/reject buttons | 2 | 4 | Pending |
| S4.3.3 | Admin UI | Create indicators dashboard | 3 | 4 | Pending |

**Total:** 147 points across 4 sprints

---

## Risk Register

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| CeX website structure changes | Medium | High | Add scraper health monitoring, fallback to policy-only |
| Sprint 3 velocity drop (scrapers complex) | Medium | Medium | Buffer 2 days, can defer admin UI to Sprint 5 |
| Optimistic locking edge cases | Low | Medium | Extensive concurrent testing in Sprint 4 |
| Database performance with anchor growth | Low | High | Add archival job in Sprint 5 if needed |

---

## Definition of Done

Each story is considered done when:

1. ✅ Code implemented and compiles
2. ✅ Unit tests written and passing
3. ✅ Integration tests passing (where applicable)
4. ✅ Code reviewed (or self-reviewed with checklist)
5. ✅ No new linting errors
6. ✅ Documentation updated (if API changes)
7. ✅ Committed to feature branch

---

## Sprint Ceremonies

| Ceremony | Frequency | Duration | Purpose |
|----------|-----------|----------|---------|
| Sprint Planning | Start of sprint | 1 hour | Select stories, estimate, assign |
| Daily Standup | Daily | 15 min | Blockers, progress |
| Sprint Review | End of sprint | 30 min | Demo deliverables |
| Retrospective | End of sprint | 30 min | Process improvements |

---

**Document Status:** Ready for Development (Phase 5A)

