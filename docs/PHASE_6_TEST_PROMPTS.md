# Phase 6 — Scraper Performance — Test Generation Prompts

## 🎯 Delegation Prompts for Testing Agents

---

### DELEGATE-TO-AGENT: UI Component Test Generator

**Agent**: Magnus UI Component Test Generator  
**Prompt to paste**:

```
Generate tests for Phase 6 Scraper Performance components

Create Jest/Vitest + React Testing Library tests for:

1. Scraper Pages:
   - ScraperPerformancePage (apps/web/app/(dashboard)/scraper/page.tsx)

2. Scraper Components:
   - PerformanceMetrics (apps/web/src/components/scraper/PerformanceMetrics.tsx)
   - VelocityChart (apps/web/src/components/scraper/VelocityChart.tsx)
   - FingerprintStats (apps/web/src/components/scraper/FingerprintStats.tsx)
   - ScraperHealth (apps/web/src/components/scraper/ScraperHealth.tsx)
   - ScraperPerformanceDashboard (apps/web/src/components/scraper/ScraperPerformanceDashboard.tsx)

3. Scraper Hooks:
   - useScraperPerformance (apps/web/src/hooks/useScraperPerformance.ts)
   - useScraperVelocity (apps/web/src/hooks/useScraperVelocity.ts)
   - useScraperFingerprints (apps/web/src/hooks/useScraperFingerprints.ts)

4. API Routes:
   - /api/scraper/performance (apps/web/app/api/scraper/performance/route.ts)
   - /api/scraper/velocity (apps/web/app/api/scraper/velocity/route.ts)
   - /api/scraper/fingerprints (apps/web/app/api/scraper/fingerprints/route.ts)

Test coverage should include:
- Rendering and basic structure
- Data fetching and loading states
- Error handling
- Time window filtering
- Marketplace filtering
- Performance metrics calculations
- Velocity trend visualization
- Fingerprint statistics display
- Health status indicators
- Empty states
- Responsive behavior
- Design token usage assertions

Use design tokens from packages/ui/theme/tokens.ts for test assertions.
Place tests in apps/web/__tests__/ following the same directory structure.
```

---

### DELEGATE-TO-AGENT: Integration Tests

**Agent**: Magnus Test Generator  
**Prompt to paste**:

```
Generate integration tests for Phase 6 Scraper Performance

Test scenarios:

1. Scraper Performance API Endpoints:
   - GET /api/scraper/performance - Verify performance metrics returned
   - GET /api/scraper/performance?marketplace=facebook - Verify filtering
   - GET /api/scraper/performance?timeWindow=7d - Verify time window filtering
   - GET /api/scraper/velocity - Verify velocity metrics returned
   - GET /api/scraper/fingerprints - Verify fingerprint stats returned

2. Scraper Performance Page Flow:
   - Navigate to /dashboard/scraper
   - Verify performance dashboard loads
   - Verify summary cards display correct metrics
   - Test time window selector (1h, 6h, 24h, 7d)
   - Test marketplace filtering
   - Verify performance metrics display
   - Verify velocity charts display
   - Verify fingerprint stats display
   - Verify health status indicators

3. Performance Calculations:
   - Verify success rate calculations
   - Verify average duration calculations
   - Verify listings per run calculations
   - Verify velocity score calculations
   - Verify duplicate rate calculations

4. Integration with Feed Engine:
   - Verify velocity ranking integration
   - Verify fingerprint v2 integration
   - Verify performance metrics flow

Generate test files:
- tests/integration/scraper-performance-api.test.ts
- tests/integration/scraper-performance-pages.test.ts
- tests/integration/scraper-calculations.test.ts
```

---

## 📋 Usage Instructions

1. **Open the specified agent** in Cursor
2. **Paste the prompt** exactly as shown above
3. **Review the output** and apply suggested fixes
4. **Update Phase 6 status** based on test results

---

## ✅ Expected Outcomes

- **Test Generator**: Comprehensive test suite with good coverage
- **Integration Tests**: Full integration test suite

---

**Ready for testing and validation!** 🧪
