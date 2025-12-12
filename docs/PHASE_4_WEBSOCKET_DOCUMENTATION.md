# Phase 4 — WebSocket Infrastructure Documentation

## 📋 WebSocket Server

**Location**: `apps/web/lib/websocket-server.ts`

### Overview

The WebSocket server provides real-time feed updates via WebSocket connections. This is an alternative to Server-Sent Events (SSE) for clients that prefer bidirectional communication.

### Features

- ✅ Standalone WebSocket server using `ws` library
- ✅ Real-time feed updates via WebSocket
- ✅ Client subscription/unsubscription
- ✅ Per-client marketplace filtering
- ✅ Polls database every 5 seconds
- ✅ Broadcasts new listings to subscribed clients

### Usage

```typescript
import { createWebSocketServer } from './lib/websocket-server';

// Start WebSocket server on port 8080
const wss = createWebSocketServer(8080);
```

### Client Protocol

#### Subscribe to Marketplaces

```json
{
  "type": "subscribe",
  "marketplaces": ["facebook", "ebay"]
}
```

#### Unsubscribe

```json
{
  "type": "unsubscribe"
}
```

### Server Messages

#### Connected

```json
{
  "type": "connected",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### Subscribed

```json
{
  "type": "subscribed",
  "marketplaces": ["facebook", "ebay"],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### Listings

```json
{
  "type": "listings",
  "count": 5,
  "listings": [...],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### Heartbeat

```json
{
  "type": "heartbeat",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### Error

```json
{
  "type": "error",
  "error": "Error message",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Integration Notes

- **Next.js Limitation**: Next.js App Router doesn't support WebSocket natively
- **Alternative**: Use standalone WebSocket server (as implemented)
- **Deployment**: Run WebSocket server as separate service or container
- **SSE Alternative**: Use `/api/search/realtime` for Server-Sent Events (simpler, one-way)

### Future Enhancements

- [ ] WebSocket client hook (`useWebSocketFeed`)
- [ ] Reconnection logic
- [ ] Message queuing for offline clients
- [ ] Authentication/authorization
- [ ] Rate limiting per client

---

## 🔌 WebSocket Client Hook (Future)

**Planned**: `apps/web/src/hooks/useWebSocketFeed.ts`

This hook will provide a React-friendly interface for WebSocket connections, similar to `useRealtimeFeed` but for WebSocket protocol.

### Planned API

```typescript
const {
  status,
  listings,
  connect,
  disconnect,
  subscribe,
  unsubscribe,
} = useWebSocketFeed({
  marketplaces: ["facebook", "ebay"],
  enabled: true,
});
```

---

**Status**: WebSocket server exists, client hook pending implementation.
