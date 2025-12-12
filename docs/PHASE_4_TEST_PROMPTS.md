# Phase 4 — Test Generation Prompts

## 🎯 Delegation Prompts for Testing Agents

---

### DELEGATE-TO-AGENT: UI Component Test Generator

**Agent**: Magnus UI Component Test Generator  
**Prompt to paste**:

```
Generate tests for Phase 4 Feed + SSE + WebSocket components

Create Jest/Vitest + React Testing Library tests for:

1. Feed Pages:
   - FeedPage (apps/web/app/(dashboard)/feed/page.tsx)

2. Feed Components:
   - FeedCard (apps/web/src/components/feed/FeedCard.tsx)
   - FeedList (apps/web/src/components/feed/FeedList.tsx)
   - FeedFilters (apps/web/src/components/feed/FeedFilters.tsx)
   - RealtimeIndicator (apps/web/src/components/feed/RealtimeIndicator.tsx)

3. Feed Hooks:
   - useFeed (apps/web/src/hooks/useFeed.ts)
   - useRealtimeFeed (apps/web/src/hooks/useRealtimeFeed.ts)

4. API Routes:
   - /api/search/feed (apps/web/app/api/search/feed/route.ts)
   - /api/search/realtime (apps/web/app/api/search/realtime/route.ts)

Test coverage should include:
- Rendering and basic structure
- Data fetching and loading states
- Error handling
- User interactions (filters, view mode switching, listing clicks)
- SSE connection lifecycle (connect, disconnect, error)
- Infinite scroll pagination
- Empty states
- Responsive behavior
- Design token usage assertions

Use design tokens from packages/ui/theme/tokens.ts for test assertions.
Place tests in apps/web/__tests__/ following the same directory structure.
```

---

### DELEGATE-TO-AGENT: End-to-End Smoke Tests

**Agent**: Magnus Test Generator (or manual test suite)  
**Prompt to paste**:

```
Generate end-to-end smoke tests for Phase 4 Feed + SSE + WebSocket

Test scenarios:

1. Feed API Endpoints:
   - GET /api/search/feed - Verify ranked feed returns listings
   - GET /api/search/feed?marketplaces=facebook,ebay - Verify filtering
   - GET /api/search/feed?cursor=... - Verify pagination
   - GET /api/search/realtime - Verify SSE stream connects and sends events

2. Feed Page Flow:
   - Navigate to /dashboard/feed
   - Verify feed loads with listings
   - Test marketplace filters
   - Test price range filters
   - Switch between paginated/realtime/hybrid modes
   - Verify infinite scroll (load more)
   - Click on listing card (opens external link)

3. Real-time Feed:
   - Connect to SSE stream
   - Verify "connected" event received
   - Verify "listings" events received
   - Verify "heartbeat" events received
   - Test reconnection on disconnect
   - Test error handling

4. Integration:
   - Verify feed integrates with AppShell layout
   - Verify feed integrates with sidebar navigation
   - Verify feed respects user authentication
   - Verify feed respects subscription tier limits

Generate test files:
- tests/e2e/feed-api.test.ts
- tests/e2e/feed-page.test.ts
- tests/e2e/realtime-feed.test.ts
```

---

## 📋 Usage Instructions

1. **Open the specified agent** in Cursor
2. **Paste the prompt** exactly as shown above
3. **Review the output** and apply suggested fixes
4. **Update Phase 4 status** based on test results

---

## ✅ Expected Outcomes

- **Test Generator**: Comprehensive test suite with good coverage
- **E2E Tests**: Full integration test suite

---

**Ready for testing and validation!** 🧪
