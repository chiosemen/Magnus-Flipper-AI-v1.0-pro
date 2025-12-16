# ADR-051: Pricing Engine Architecture

## Status

Accepted

## Context

Tech Trade requires a pricing engine that can:
- Calculate accurate trade-in values for tech devices
- Incorporate market signals from external sources (CeX, Back Market)
- Enforce business rules (minimum margins, price floors)
- Produce transparent, auditable price breakdowns
- Scale to handle thousands of quotes per day

The key architectural question is how to structure the pricing calculation to be both accurate and maintainable.

## Decision

We will implement a **multi-layer deterministic pricing engine** with the following structure:

### Pricing Layers

```
1. Base Price Layer
   └── Device catalog base price (e.g., £450 for iPhone 13)

2. Condition Layer
   └── Multiplier based on device condition
       - New: 1.0 (100%)
       - Excellent: 0.85 (85%)
       - Good: 0.70 (70%)
       - Fair: 0.50 (50%)

3. Attribute Layer
   └── Adjustments for device configuration
       - Storage: +£30 for 256GB, -£25 for 64GB
       - Color: +£10 for rare colors
       - Carrier: -£40 for locked devices

4. Market Anchor Layer
   └── Blended price from external market signals
       - CeX: 40% weight
       - Back Market: 40% weight
       - Policy: 20% weight

5. Policy Enforcement Layer
   └── Business rules applied last
       - Absolute floor (never below £10)
       - Margin floor (15% minimum margin)
```

### Key Design Principles

1. **Deterministic**: Same inputs always produce same outputs
2. **Transparent**: Full breakdown available for debugging
3. **Testable**: Pure functions where possible
4. **Configurable**: Weights and multipliers stored in database

## Consequences

### Positive

1. **Transparency**: Users and admins can understand price derivation
2. **Debugging**: Easy to trace why a specific price was generated
3. **Auditability**: Full breakdown stored with each quote
4. **Flexibility**: Weights and multipliers can be tuned without code changes
5. **Testability**: Pure calculation functions are easy to unit test

### Negative

1. **Complexity**: Multiple layers add cognitive overhead
2. **Maintenance**: Policy changes may require careful testing
3. **Performance**: Multiple calculations per quote (mitigated by caching)

### Mitigations

- Comprehensive test suite (192+ tests)
- Clear documentation of each layer
- Policy caching to reduce database lookups
- Monitoring of quote generation latency

## Alternatives Considered

### Alternative 1: ML-Based Pricing

**Rejected** because:
- Insufficient historical data for training
- Black-box pricing is hard to explain to users
- Requires ML infrastructure and expertise
- Harder to debug and audit

### Alternative 2: Simple Markup Model

**Rejected** because:
- Ignores market signals
- Less accurate pricing
- No competitive positioning

### Alternative 3: Real-Time Market Making

**Rejected** because:
- Overkill for trade-in use case
- Requires live market data feeds
- Higher operational complexity

## References

- [pricing-engine.ts](../../packages/tech-trade-core/src/pricing-engine.ts)
- [pricing-engine.test.ts](../../packages/tech-trade-core/__tests__/pricing-engine.test.ts)

