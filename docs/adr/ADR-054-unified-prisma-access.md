# ADR-054: Unified Prisma Access via @magnus-flipper-ai/core/db

## Status

Accepted (Existing Pattern)

## Context

The Magnus Flipper AI monorepo contains multiple packages and applications that need database access. Without a centralized approach, we risk:
- Schema drift between packages
- Multiple Prisma client instances
- Inconsistent connection pooling
- Difficult migrations

The existing pattern uses a centralized database module in `packages/core`.

## Decision

**All packages and applications must access Prisma through `@magnus-flipper-ai/core/db`.**

### Implementation

```typescript
// ✅ CORRECT: Import from core/db
import { db } from '@magnus-flipper-ai/core/db';

const devices = await db.techDevice.findMany();

// ❌ WRONG: Direct Prisma import
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
```

### Package Structure

```
packages/core/
├── src/
│   ├── db.ts          # Lazy Prisma client export
│   └── index.ts       # Re-exports
├── prisma/
│   └── schema.prisma  # Single source of truth for schema
└── package.json       # Exports ./db subpath
```

### Schema Location

All database models, including Tech Trade models, are defined in:
`packages/core/prisma/schema.prisma`

### Migration Workflow

```bash
# Generate migration from schema changes
cd packages/core
pnpm prisma migrate dev --name add_tech_trade_models

# Apply to production
pnpm prisma migrate deploy
```

## Consequences

### Positive

1. **Single source of truth**: One schema, one client
2. **Consistent connection pooling**: Shared pool across packages
3. **Simplified migrations**: One place to manage schema changes
4. **Type safety**: Generated types shared across monorepo
5. **Lazy initialization**: Client created on first use

### Negative

1. **Coupling**: All packages depend on core
2. **Circular dependency risk**: Must be careful with imports
3. **Build order**: Core must build before dependents

### Mitigations

- Document import patterns clearly
- CI checks for direct Prisma imports
- Workspace dependency ordering in pnpm

## Alternatives Considered

### Alternative 1: Per-Package Prisma Clients

**Rejected** because:
- Schema drift risk
- Multiple connection pools
- Inconsistent types
- Migration complexity

### Alternative 2: Shared Schema, Separate Clients

**Rejected** because:
- Still multiple connection pools
- Harder to manage client configuration
- No single source of truth for client

### Alternative 3: Database-per-Service

**Rejected** because:
- Overkill for monorepo
- Data synchronization complexity
- Higher infrastructure costs

## Enforcement

The following patterns are prohibited and should be caught in code review:

```typescript
// ❌ Prohibited patterns
import { PrismaClient } from '@prisma/client';
import { PrismaClient } from '../../core/node_modules/@prisma/client';
const prisma = new PrismaClient();
```

## References

- [packages/core/src/db.ts](../../packages/core/src/db.ts)
- [packages/core/prisma/schema.prisma](../../packages/core/prisma/schema.prisma)

