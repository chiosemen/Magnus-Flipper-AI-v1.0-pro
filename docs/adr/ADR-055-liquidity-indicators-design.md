# ADR-055: Liquidity Indicators Design

## Status

Accepted

## Context

Operations teams need visibility into market health to:
- Identify pricing issues before they affect users
- Monitor scraper reliability
- Track quote volume trends
- Debug problematic quotes

We need a set of metrics that provide actionable insights without overwhelming operators.

## Decision

We will implement **on-demand liquidity indicators** with the following metrics:

### Metric Categories

#### 1. Volume Metrics
```typescript
interface VolumeMetrics {
  quotesToday: number;      // Quotes in last 24 hours
  quotesThisWeek: number;   // Quotes in last 7 days
  quotesThisMonth: number;  // Quotes in last 30 days
  quotesByDay: Array<{      // Daily breakdown
    date: string;           // YYYY-MM-DD
    count: number;
  }>;
}
```

#### 2. Anchor Metrics
```typescript
interface AnchorMetrics {
  total: number;            // All anchors
  pending: number;          // Awaiting approval
  approved: number;         // Active in pricing
  rejected: number;         // Flagged as invalid
  stale: number;            // Older than max age
  bySource: {               // Per-source breakdown
    cex: { total, approved, stale };
    back_market: { total, approved, stale };
  };
}
```

#### 3. Confidence Metrics
```typescript
interface ConfidenceMetrics {
  overall: number;          // 0.0 - 1.0
  bySource: {
    cex: number;
    back_market: number;
  };
  factors: {
    freshness: number;      // % of anchors within max age
    sourceAgreement: number; // Inverse of price variance
    coverage: number;       // % of sources with data
  };
}
```

#### 4. Momentum Metrics
```typescript
interface MomentumMetrics {
  trend: 'up' | 'down' | 'stable';  // Direction
  percentChange7d: number;          // Week-over-week
  percentChange30d: number;         // Month-over-month
  priceHistory: Array<{             // Daily averages
    date: string;
    avgPrice: number;
  }>;
}
```

### Calculation Strategy

- **On-demand**: Metrics calculated when requested, not pre-computed
- **Caching**: Results cached for 5 minutes to reduce load
- **Filtering**: Support filtering by device, source, date range

## Consequences

### Positive

1. **Real-time insights**: Always current data
2. **Flexibility**: Filter by device or source
3. **Actionable**: Clear metrics with obvious interpretations
4. **Debugging aid**: Helps trace pricing issues

### Negative

1. **Computation cost**: Aggregations on every request
2. **No historical trends**: Only current snapshot
3. **Cache staleness**: 5-minute delay possible

### Mitigations

- Implement efficient database indexes
- Add background job for heavy computations if needed
- Consider materialized views for historical trends

## Alternatives Considered

### Alternative 1: Pre-Computed Materialized Views

**Rejected** because:
- Added complexity for MVP
- Stale data between refreshes
- Can add later if needed

### Alternative 2: Real-Time Streaming Metrics

**Rejected** because:
- Requires additional infrastructure (Kafka, etc.)
- Overkill for current scale
- Higher operational complexity

### Alternative 3: Third-Party Analytics

**Rejected** because:
- Additional cost
- Data privacy concerns
- Less customizable

## Future Considerations

- Add alerting based on metric thresholds
- Implement trend analysis (anomaly detection)
- Build Grafana dashboard for visualization
- Consider pre-computation for frequently accessed metrics

## References

- [market-indicators.ts](../../packages/tech-trade-core/src/market-indicators.ts)
- [market-indicators.test.ts](../../packages/tech-trade-core/__tests__/market-indicators.test.ts)

