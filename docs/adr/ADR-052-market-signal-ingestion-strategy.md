# ADR-052: Market Signal Ingestion Strategy

## Status

Accepted

## Context

To provide accurate, market-aware pricing, Tech Trade needs pricing data from external marketplaces. The primary sources identified are:

1. **CeX (UK)**: Major electronics reseller with consistent pricing
2. **Back Market**: Refurbished device marketplace with competitive pricing

The key decision is how to obtain this data:
- Official API integration
- Web scraping
- Manual data entry
- Third-party data providers

## Decision

We will use **web scraping** to ingest market signals from CeX and Back Market, with the following safeguards:

### Implementation

1. **Scraper Architecture**
   - Extend existing `packages/scraper-sync` infrastructure
   - Create dedicated scrapers: `cex.ts`, `back-market.ts`
   - Rate limiting: 60 requests/minute per source
   - Retry logic with exponential backoff

2. **Data Flow**
   ```
   Scheduler (6 AM daily)
     → Scraper fetches prices
     → Raw data normalized
     → MarketAnchor records created (status: pending)
     → Admin reviews and approves
     → Approved anchors used in pricing
   ```

3. **Quality Gates**
   - All scraped data requires admin approval
   - Anchors expire after 7 days (configurable)
   - Invalid prices (≤0) filtered automatically
   - Scraper health monitoring with alerts

## Consequences

### Positive

1. **No partnership required**: Can start immediately without business deals
2. **Comprehensive data**: Access to full product catalogs
3. **Flexibility**: Can add new sources without API agreements
4. **Cost-effective**: No data licensing fees

### Negative

1. **Fragility**: Scrapers break when websites change
2. **Legal risk**: May violate terms of service
3. **Manual approval**: Slower anchor updates
4. **Rate limiting**: Must respect target sites

### Mitigations

- **Scraper monitoring**: Alert on failures > 24 hours
- **Fallback pricing**: Policy-only pricing when anchors unavailable
- **Legal review**: Consult legal on scraping practices
- **Respectful scraping**: Low rate limits, proper User-Agent

## Alternatives Considered

### Alternative 1: Official API Integration

**Rejected** because:
- CeX and Back Market don't offer public APIs
- Partnership negotiations would delay launch
- May require revenue sharing agreements

### Alternative 2: Third-Party Data Providers

**Rejected** because:
- High cost for device pricing data
- Limited coverage for UK market
- Additional vendor dependency

### Alternative 3: Manual Data Entry

**Rejected** because:
- Not scalable (500+ devices × 4 conditions)
- Prone to human error
- Slow update cycle

### Alternative 4: User-Submitted Prices

**Rejected** because:
- Manipulation risk
- Inconsistent data quality
- Insufficient volume initially

## Future Considerations

- Explore API partnerships once volume justifies business development
- Consider adding eBay sold listings as additional signal
- Implement automated anomaly detection for scraped prices

## References

- [TECHNICAL_DESIGN.md](../tech-trade/TECHNICAL_DESIGN.md) - Section 7
- [SUBSYSTEM_SPECS.md](../tech-trade/SUBSYSTEM_SPECS.md) - Section 3

