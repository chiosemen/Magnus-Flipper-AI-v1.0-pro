# Source Fallback Decision Trees

## Overview

This runbook defines decision logic for choosing between Apify and DIY sources when both are available.

## Source Selection Strategy

### Phase 1 (Current)
- **Primary**: DIY (only source available)
- **Fallback**: None
- **Decision**: Always use DIY

### Phase 2+ (With Apify)
- **Primary**: Apify (preferred for reliability)
- **Fallback**: DIY (if Apify fails or returns zero)
- **Decision**: Use Apify if it has items, otherwise fall back to DIY

## Decision Tree

```
Start
  |
  ├─ Apify has items > 0?
  |   |
  |   ├─ Yes → Use Apify
  |   |
  |   └─ No → Check DIY
  |       |
  |       ├─ DIY has items > 0?
  |       |   |
  |       |   ├─ Yes → Use DIY (fallback)
  |       |   |
  |       |   └─ No → Both failed → Mark degraded
  |
  └─ Log resolver decision
```

## Resolver Decision Logging

Every decision must log:
- `apify_items`: Number of items from Apify
- `diy_items`: Number of items from DIY
- `chosen_source`: Which source was selected
- `reason`: Why this source was chosen
- `confidence`: Confidence in decision (0-1)

## Common Scenarios

### Scenario 1: Apify Success
- **Apify**: 25 items
- **DIY**: 0 items
- **Decision**: Use Apify
- **Reason**: "Apify returned items, DIY returned zero"
- **Confidence**: 0.9

### Scenario 2: Apify Failure, DIY Success
- **Apify**: 0 items
- **DIY**: 15 items
- **Decision**: Use DIY
- **Reason**: "Apify returned zero, DIY fallback successful"
- **Confidence**: 0.8

### Scenario 3: Both Success (Apify Preferred)
- **Apify**: 30 items
- **DIY**: 28 items
- **Decision**: Use Apify
- **Reason**: "Apify preferred, both sources successful"
- **Confidence**: 0.95

### Scenario 4: Both Failed
- **Apify**: 0 items
- **DIY**: 0 items
- **Decision**: Use none (degraded)
- **Reason**: "Both sources returned zero results"
- **Confidence**: 0.7

## Escalation Rules

### Apify Rescues DIY ≥70% of Runs
- **Action**: Recommend deprioritizing DIY fixes for that marketplace
- **Rationale**: Apify is reliable enough, DIY maintenance not critical
- **Change Request**: Update marketplace_control.prefer_source to 'apify'

### Both Sources Fail Consecutively ≥2 Runs
- **Action**: Recommend temporary marketplace disable
- **Rationale**: Wasting resources on broken marketplace
- **Change Request**: Set marketplace_control.enabled = false

### DIY Consistently Outperforms Apify
- **Action**: Investigate Apify actor configuration
- **Rationale**: Apify should be more reliable
- **Change Request**: Review Apify actor settings

## Monitoring

Track these metrics:
- Apify win rate per marketplace
- DIY fallback success rate
- Degraded marketplace frequency
- Source reliability trends

## Best Practices

1. **Always prefer Apify** when both sources available
2. **Log all decisions** for explainability
3. **Monitor fallback patterns** to identify issues
4. **Escalate repeated failures** automatically
5. **Review source performance** weekly

