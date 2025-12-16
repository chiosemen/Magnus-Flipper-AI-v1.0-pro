# ADR-057: Pricing Kill Switch and Risk Halt

## Status

**Accepted**

## Context

Magnus Tech Trade is a market-signal-driven pricing system that ingests external data from CeX and Back Market to inform device valuations. This dependency on external market signals introduces operational risk:

1. **Data Quality Risk**: Scraped market anchors may contain erroneous prices due to scraper bugs, website changes, or data entry errors on source platforms.

2. **Market Volatility**: External market conditions (e.g., new product launches, economic events) can cause rapid price swings that our system would propagate to customer-facing quotes.

3. **Cascade Failures**: A bad anchor approved into the system could affect thousands of quotes before detection, with potential financial impact.

4. **Incident Response Time**: Without a kill switch, responding to pricing anomalies requires code deployment, which takes minutes to hours depending on CI/CD pipeline state and approval processes.

5. **Bulk/B2B Trade Risk**: Business-to-business trades involve higher volumes and financial exposure. During incidents, these should be blocked immediately while consumer quotes may continue with degraded (but safe) pricing.

The pricing engine must remain operational for B2C users even during incidents, but market-derived pricing should be suspendable without service interruption.

## Decision

Introduce a **global risk halt (kill switch)** that controls market-sensitive pricing behavior across the Tech Trade system.

### Configuration

The kill switch is controlled via:

1. **Environment Variable** (primary): `TECH_TRADE_RISK_HALT=true`
2. **Programmatic Override** (testing/admin): `setRiskControlConfig()` function

### Behavior When Halted

| Component | Normal Mode | Halted Mode |
|-----------|-------------|-------------|
| Anchor Blending | Active (40/40/20 weighting) | **Disabled** (fallback to base price + policy) |
| B2C Quotes | Full market pricing | Continue with `pricingFrozen: true` flag |
| Bulk/B2B Trades | Allowed | **Rejected** with `PricingHaltedError` |
| Market Indicators | Normal | `systemStatus.pricingHalted: true` |

### Implementation Location

All enforcement logic is centralized in:

```
packages/tech-trade-core/src/policy-enforcement.ts
```

This ensures:
- No scattered `if (halted)` checks across the codebase
- Single point of control for risk behavior
- Deterministic, testable pricing engine
- Clear audit trail for state changes

### API Surface

```typescript
// Check state
isPricingHalted(): boolean
getRiskControlConfig(): RiskControlConfig

// Set state (testing/admin)
setRiskControlConfig(config: RiskControlConfig): void
resetRiskControl(): void

// Assertions (throws on halt)
assertBulkTradeAllowed(): void
```

### Quote Response Changes

When halted, the `QuoteBreakdown` includes:

```typescript
{
  // ... existing fields ...
  pricingFrozen: true,  // Indicates fallback pricing was used
  anchorBlendedPrice: null,  // No market signals applied
}
```

## Consequences

### Positive

1. **Immediate Risk Mitigation**: Operators can halt market-sensitive pricing within seconds via environment variable change, without code deployment.

2. **Graceful Degradation**: B2C users continue receiving quotes (policy-based) while market signals are suspended.

3. **Clear Communication**: The `pricingFrozen` flag allows UIs to display appropriate warnings to users.

4. **Audit Trail**: The `haltReason`, `haltedAt`, and `haltedBy` fields provide incident documentation.

5. **Testability**: Programmatic override enables comprehensive testing of halted behavior without environment manipulation.

6. **Bulk Trade Protection**: Higher-risk B2B operations are automatically blocked during incidents.

### Negative

1. **Temporary Loss of Market Responsiveness**: While halted, quotes do not reflect current market conditions, potentially resulting in:
   - Overpriced quotes (lost sales)
   - Underpriced quotes (reduced margins)

2. **Operational Complexity**: Teams must understand the kill switch behavior and include it in incident response procedures.

3. **State Management**: The global state pattern requires careful handling in tests and multi-tenant scenarios.

### Mitigations

- **Monitoring**: Add alerts for `pricingHalted: true` state persisting beyond expected incident windows.
- **Documentation**: Include kill switch in runbooks and on-call documentation.
- **Automated Recovery**: Consider time-based auto-reset or health-check-based recovery in future iterations.

## Alternatives Considered

### 1. Rely on Code Deployments Only

**Rejected**: Deployment time (5-30 minutes) is too slow for incident response. A bad pricing signal could affect thousands of quotes during this window.

### 2. Per-Feature Flags (Granular)

**Rejected**: Increases complexity without proportional benefit. The pricing system is tightly coupled—partial halts (e.g., halt CeX but not Back Market) create confusing edge cases and are rarely needed.

### 3. Database-Backed Config Only

**Rejected as sole mechanism**: Database adds latency and failure modes. Environment variable provides faster, more reliable toggle. Database-backed config may be added later as a secondary mechanism for admin UI control.

### 4. Circuit Breaker Pattern (Automatic)

**Deferred**: Automatic halt based on anomaly detection is valuable but requires:
- Baseline metrics for "normal" pricing behavior
- Threshold tuning to avoid false positives
- More complex implementation

This may be added in a future iteration after manual kill switch proves the concept.

### 5. Rate Limiting Instead of Full Halt

**Rejected**: Rate limiting doesn't address data quality issues. A bad anchor affects all quotes, not just high-volume scenarios.

## References

- [ADR-051: Pricing Engine Architecture](./ADR-051-pricing-engine-architecture.md)
- [ADR-052: Market Signal Ingestion Strategy](./ADR-052-market-signal-ingestion-strategy.md)
- Implementation: `packages/tech-trade-core/src/policy-enforcement.ts`
- Tests: `packages/tech-trade-core/__tests__/risk-control.test.ts`

## Changelog

| Date | Author | Change |
|------|--------|--------|
| 2024-12-16 | Engineering | Initial decision |

