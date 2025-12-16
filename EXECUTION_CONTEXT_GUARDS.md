# Execution Context Guards - Quick Reference

> **See also**: [ERROR_BOUNDARY_RULES.md](./ERROR_BOUNDARY_RULES.md) - Specific rules for error boundaries (no hooks allowed)

## When to Use

Use execution context guards whenever code might run during Next.js build phase but should only execute at runtime.

### Common Scenarios:

1. **Database Connections** (Prisma, Postgres, MongoDB)
2. **Redis/Cache Clients** (IORedis, Upstash)
3. **Message Queues** (BullMQ, SQS, PubSub)
4. **External Service Clients** (Stripe, SendGrid, AWS SDK)
5. **WebSocket Connections**
6. **Error Boundaries** (must be SSR-pure, see [ERROR_BOUNDARY_RULES.md](./ERROR_BOUNDARY_RULES.md))

## The Problem

```typescript
// ❌ BAD: Runs during `next build`
import { Redis } from "ioredis";

export const redis = new Redis(process.env.REDIS_URL);
// ^ This connects immediately when module is imported
// ^ Next.js loads this during build → ECONNREFUSED
```

**Why it happens:**
- Next.js analyzes all routes during build
- Imports modules to extract metadata
- Module-scope code executes immediately
- Services aren't available during build → connection errors

## The Solution

### Pattern 1: Lazy Loading with Proxy

```typescript
// ✅ GOOD: Defers instantiation until first use
import { Redis } from "ioredis";

let _redis: Redis | null = null;

function getRedis(): Redis {
  if (_redis) return _redis;
  
  // Build context guard
  if (isBuildContext()) {
    return createMockRedis();
  }
  
  _redis = new Redis(process.env.REDIS_URL);
  return _redis;
}

// Export via Proxy (transparent to consumers)
export const redis = new Proxy({} as Redis, {
  get(target, prop) {
    const instance = getRedis();
    const value = (instance as any)[prop];
    return typeof value === "function" ? value.bind(instance) : value;
  },
});
```

### Pattern 2: Function-Based Lazy Loading

```typescript
// ✅ GOOD: Simpler, but consumers must call function
import { PrismaClient } from "@prisma/client";

let _prisma: PrismaClient | null = null;

export function getPrisma(): PrismaClient {
  if (_prisma) return _prisma;
  
  if (isBuildContext()) {
    throw new Error("Database not available during build");
  }
  
  _prisma = new PrismaClient();
  return _prisma;
}

// Usage: const prisma = getPrisma();
```

## Build Context Detection

```typescript
/**
 * Detect if we're in Next.js build phase
 * STRATEGY: Default to build context unless proven otherwise (safer)
 */
function isBuildContext(): boolean {
  // Explicit skip flag
  if (process.env.SKIP_BUILD_CONNECTIONS === "true") {
    return true;
  }
  
  // Next.js build phase marker
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return true;
  }
  
  // Next.js build worker marker
  if (process.env.__NEXT_PRIVATE_PREBUNDLED_REACT) {
    return true;
  }
  
  // If no config provided, assume build context
  // (Runtime MUST have config)
  if (!process.env.DATABASE_URL && !process.env.REDIS_URL) {
    return true;
  }
  
  return false;
}
```

## Mock Clients for Build Phase

```typescript
function createMockRedis(): Redis {
  const methods = [
    'get', 'set', 'del', 'hget', 'hset', 'hgetall',
    'ping', 'connect', 'disconnect', 'quit'
  ];
  
  const mock: any = {
    status: "end",
    // All methods return resolved promises
    ...Object.fromEntries(
      methods.map(m => [m, async () => mock])
    ),
  };
  
  return mock as Redis;
}
```

## API Route Pattern

```typescript
// app/api/data/route.ts
import { redis } from "@/lib/redis"; // Lazy-loaded

export async function GET(req: Request) {
  // ✅ Redis only instantiates here at runtime
  const data = await redis.get("key");
  
  return Response.json({ data });
}
```

## Server Component Pattern

```typescript
// app/data/page.tsx
import { getPrisma } from "@/lib/db";

export default async function DataPage() {
  // ✅ Database only connects at runtime
  const prisma = getPrisma();
  const items = await prisma.item.findMany();
  
  return <div>{/* render items */}</div>;
}
```

## Testing Your Guards

```bash
# Test 1: Build should succeed without services
$ pnpm --filter web build
# ✅ Should complete with exit 0, no ECONNREFUSED

# Test 2: Build without config should use mocks
$ env -u DATABASE_URL -u REDIS_URL pnpm --filter web build
# ✅ Should complete successfully with mocks

# Test 3: Check for connection errors
$ pnpm --filter web build 2>&1 | grep -c "ECONNREFUSED"
0  # ✅ Must be exactly 0
```

## Common Mistakes

### ❌ Mistake 1: lazyConnect alone isn't enough

```typescript
// ❌ STILL attempts connection during Queue instantiation
const redis = new Redis({ lazyConnect: true });
const queue = new Queue("name", { connection: redis });
// ^ Queue constructor triggers connection validation
```

**Fix:** Use Proxy + build guards

### ❌ Mistake 2: Forgot to rebuild package

```typescript
// Changed packages/queue/src/redis.ts
// But forgot: pnpm --filter @magnus-flipper-ai/queue build
// Next.js still uses OLD dist/ output
```

**Fix:** Always rebuild after changes to package sources

### ❌ Mistake 3: Import side effects

```typescript
// ❌ Side effect runs at import time
import "./setup-database"; // <- Connects to DB immediately

export function handler() { }
```

**Fix:** Move setup into runtime function

## Checklist for New Service Integrations

When adding a new external service:

- [ ] No `new` statements at module scope
- [ ] Use lazy loading (Proxy or function-based)
- [ ] Add build context detection
- [ ] Create mock client for build phase
- [ ] Test build without service running
- [ ] Rebuild package if in packages/
- [ ] Document in this guide

## Real-World Example: Redis + BullMQ

See `packages/queue/src/` for complete implementation:

- `redis.ts` - Lazy Redis with Proxy + build guards
- `queues.ts` - Lazy Queue with Proxy + build guards
- `types.ts` - Type definitions only (no runtime code)

**Result:** Zero ECONNREFUSED errors during build

## Environment Variables

Set these in CI/CD for build-time:

```bash
# .env.build
SKIP_BUILD_CONNECTIONS=true
NEXT_PHASE=phase-production-build
```

**Next.js Config:**
```javascript
// next.config.mjs
export default {
  env: {
    SKIP_BUILD_CONNECTIONS: process.env.CI ? 'true' : 'false',
  },
};
```

## Debugging

Enable debug logging:

```typescript
function getRedis(): Redis {
  if (process.env.DEBUG_CONNECTIONS) {
    console.log('[Redis] Context:', {
      isBuild: isBuildContext(),
      phase: process.env.NEXT_PHASE,
      hasConfig: !!process.env.REDIS_URL,
    });
  }
  // ... rest of implementation
}
```

Run with: `DEBUG_CONNECTIONS=true pnpm --filter web build`

## Resources

- [Next.js Build Phases](https://nextjs.org/docs/api-reference/next.config.js/environment-variables)
- [IORedis Lazy Connect](https://github.com/luin/ioredis#lazily-connect)
- [BullMQ Configuration](https://docs.bullmq.io/guide/connections)

---

**Last Updated:** December 16, 2025  
**Applies To:** Next.js 14+, pnpm monorepos  
**Tested With:** Next.js 16.0.7 + Turbopack

