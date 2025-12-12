# Phase 4 — Feed + SSE + WebSocket — Execution Plan

## 📋 Sprint Command

**Command**: Start Sprint Execution — Phase 4 (Feed + SSE + WebSocket)  
**Goal**: Implement Feed UI, SSE integration, and WebSocket infrastructure  
**Status**: 🚀 **In Progress**

---

## 🎯 Phase 4 Objectives

- ✅ Feed API endpoints (`/api/search/feed`) — **Already exists**
- ✅ SSE endpoint (`/api/search/realtime`) — **Already exists**
- ✅ WebSocket infrastructure — **Partially exists**
- ⚠️ Frontend hooks for feed consumption — **Needs creation**
- ⚠️ Feed UI components — **Needs creation**
- ⚠️ Real-time feed page integration — **Needs creation**
- ⚠️ End-to-end smoke tests — **Needs creation**

---

## 📋 Sprint Step Plan (8 Steps)

### Step 1: ✅ **EXECUTE-HERE** — Inspect Existing Infrastructure
**Status**: In Progress
- ✅ Found `/api/search/feed` — ranked feed endpoint
- ✅ Found `/api/search/realtime` — SSE endpoint
- ✅ Found `/api/search/websocket` — WebSocket placeholder
- ✅ Found `packages/feed-engine` — aggregation/ranking engine
- ✅ Found `apps/worker-realtime` — real-time worker
- ✅ Found `apps/web/lib/websocket-server.ts` — WebSocket server
- ⚠️ No frontend hooks for feed consumption
- ⚠️ No feed UI components in web app
- ⚠️ No feed page integrated into dashboard

### Step 2: ✅ **EXECUTE-HERE** — Create TypeScript Types
**Status**: Pending
- Create feed data types in `packages/core/src/types/feed.ts`
- Define: FeedListing, FeedResponse, RealtimeEvent, WebSocketMessage
- Export from packages/core

### Step 3: ✅ **EXECUTE-HERE** — Create React Hooks
**Status**: Pending
- `apps/web/src/hooks/useFeed.ts` — consume `/api/search/feed`
- `apps/web/src/hooks/useRealtimeFeed.ts` — consume SSE `/api/search/realtime`
- `apps/web/src/hooks/useWebSocketFeed.ts` — consume WebSocket (optional)

### Step 4: ✅ **EXECUTE-HERE** — Create Feed UI Components
**Status**: Pending
- `apps/web/src/components/feed/FeedList.tsx` — list of feed items
- `apps/web/src/components/feed/FeedCard.tsx` — individual feed item card
- `apps/web/src/components/feed/FeedFilters.tsx` — marketplace/price filters
- `apps/web/src/components/feed/RealtimeIndicator.tsx` — SSE connection status

### Step 5: ✅ **EXECUTE-HERE** — Create Feed Page
**Status**: Pending
- `apps/web/app/(dashboard)/feed/page.tsx` — main feed page
- Use AppShell + PageHeader pattern
- Integrate feed components
- Support both paginated feed and real-time updates

### Step 6: ✅ **EXECUTE-HERE** — Enhance WebSocket Infrastructure
**Status**: Pending
- Review `apps/web/lib/websocket-server.ts`
- Create WebSocket client hook (if needed)
- Document WebSocket usage

### Step 7: ⚠️ **DELEGATE-TO-AGENT** — Generate Test Prompts
**Status**: Pending
- UI Component Test Generator prompts
- End-to-end smoke test prompts

### Step 8: ✅ **EXECUTE-HERE** — Integration & Documentation
**Status**: Pending
- Wire feed page into sidebar navigation
- Create integration documentation
- Generate summary

---

## 🚀 Execution Begins

Starting with Steps 2-6: Types, Hooks, Components, Feed Page, and WebSocket enhancements.
