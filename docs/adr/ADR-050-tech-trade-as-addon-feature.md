# ADR-050: Tech Trade as Add-on Feature

## Status

Accepted

## Context

Magnus Flipper AI is an established marketplace flipping platform with existing infrastructure for scraping, data processing, and user management. We need to add tech device valuation capabilities to the platform.

The key question is whether to build Tech Trade as:
1. A standalone microservice with its own infrastructure
2. An add-on feature integrated into the existing monorepo

Considerations include:
- Development velocity and time-to-market
- Infrastructure costs and operational complexity
- Code reuse and consistency
- Team expertise and maintenance burden
- Future scalability requirements

## Decision

We will implement Tech Trade as an **add-on feature** within the existing Magnus Flipper AI monorepo, specifically:

- Create a new package: `packages/tech-trade-core` for domain logic
- Extend the existing Prisma schema in `packages/core/prisma/schema.prisma`
- Add API routes in `apps/web/app/api/tech-trade/`
- Leverage existing scraper infrastructure in `packages/scraper-sync`
- Use existing worker scheduler for market anchor ingestion

## Consequences

### Positive

1. **Faster time-to-market**: No new infrastructure to provision
2. **Code reuse**: Leverage existing authentication, database, and scraper systems
3. **Unified user experience**: Single login, consistent UI patterns
4. **Reduced operational complexity**: One deployment pipeline, one monitoring stack
5. **Shared team knowledge**: Same tech stack, patterns, and conventions
6. **Cost efficiency**: No additional hosting, databases, or CI/CD pipelines

### Negative

1. **Coupling risk**: Changes to core systems may affect Tech Trade
2. **Deployment coordination**: Tech Trade releases tied to main app releases
3. **Database growth**: Single database handles all features
4. **Scaling constraints**: Cannot scale Tech Trade independently

### Mitigations

- Use feature flags to enable/disable Tech Trade independently
- Design clear module boundaries with minimal cross-dependencies
- Monitor database performance and add indexes proactively
- Document clear ownership and testing requirements

## Alternatives Considered

### Alternative 1: Standalone Microservice

**Rejected** because:
- Premature complexity for an MVP feature
- Higher infrastructure costs
- Longer development timeline
- Requires new CI/CD pipelines and monitoring
- Team would need to maintain two systems

### Alternative 2: Separate Database with Shared Auth

**Rejected** because:
- Data synchronization complexity
- Partial coupling provides worst of both worlds
- User experience fragmentation

## References

- [TECHNICAL_DESIGN.md](../tech-trade/TECHNICAL_DESIGN.md)
- [SUBSYSTEM_SPECS.md](../tech-trade/SUBSYSTEM_SPECS.md)

