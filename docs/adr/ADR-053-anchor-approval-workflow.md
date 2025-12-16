# ADR-053: Anchor Approval Workflow

## Status

Accepted

## Context

Market anchors scraped from external sources may contain errors, anomalies, or manipulated data. Using bad pricing data could result in:
- Financial losses from incorrect quotes
- User trust erosion
- Regulatory concerns

We need a mechanism to ensure data quality before anchors influence pricing.

## Decision

We will implement a **human-in-the-loop approval workflow** with the following characteristics:

### Workflow States

```
┌─────────┐     ┌──────────┐     ┌──────────┐
│ Scraper │ ──► │ Pending  │ ──► │ Approved │
└─────────┘     └──────────┘     └──────────┘
                     │
                     ▼
                ┌──────────┐
                │ Rejected │
                └──────────┘
```

### State Machine

| State | Description | Used in Pricing |
|-------|-------------|-----------------|
| `pending` | Awaiting admin review | ❌ No |
| `approved` | Verified by admin | ✅ Yes |
| `rejected` | Flagged as invalid | ❌ No |

### Optimistic Locking

To prevent race conditions when multiple admins review the same anchor:

```typescript
model MarketAnchor {
  // ...
  version Int @default(0) // Increment on each update
}

// Approval requires matching version
UPDATE market_anchors
SET status = 'approved', version = version + 1
WHERE id = :id AND version = :expectedVersion
```

### Audit Trail

Every approval/rejection creates an audit entry:

```typescript
interface AuditEntry {
  anchorId: string;
  action: 'approve' | 'reject';
  adminId: string;
  timestamp: Date;
  previousStatus: string;
  newStatus: string;
}
```

## Consequences

### Positive

1. **Data quality**: Human verification catches anomalies
2. **Accountability**: Audit trail shows who approved what
3. **Safety**: Bad data never reaches pricing engine
4. **Reversibility**: Can track and investigate bad approvals

### Negative

1. **Latency**: Anchors not immediately usable
2. **Manual effort**: Requires admin time
3. **Bottleneck**: Slow approvals delay pricing updates
4. **Complexity**: Additional state management

### Mitigations

- **Batch approval UI**: Approve multiple anchors at once
- **Auto-flagging**: Highlight suspicious prices for review
- **SLA monitoring**: Alert if pending queue grows too large
- **Fallback pricing**: Policy-only pricing when anchors pending

## Alternatives Considered

### Alternative 1: Automated Approval

**Rejected** because:
- Risk of bad data entering pricing
- Difficult to define "valid" programmatically
- No accountability for errors

### Alternative 2: Sampling-Based Approval

**Rejected** because:
- Bad data in unsampled anchors could slip through
- Statistical confidence requires large samples
- Still needs manual review for samples

### Alternative 3: Delayed Automatic Approval

**Rejected** because:
- Time delay doesn't improve data quality
- Still allows bad data eventually
- False sense of security

## Future Considerations

- Implement ML-based anomaly detection to assist reviewers
- Add confidence scoring to auto-approve high-confidence anchors
- Build approval queue prioritization (high-value devices first)

## References

- [anchor-approval-workflow.integration.test.ts](../../packages/tech-trade-core/__tests__/integration/anchor-approval-workflow.integration.test.ts)
- [DESIGN_REVIEW.md](../tech-trade/DESIGN_REVIEW.md) - Section 1.1

