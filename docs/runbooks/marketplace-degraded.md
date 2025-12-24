# Marketplace Degraded Handling

## Overview

When a marketplace returns zero results from all sources, it is marked as "degraded". This runbook covers the response procedure.

## Detection

A marketplace is considered degraded when:
- Both Apify and DIY sources return zero items
- No exceptions were thrown (silent failure)
- Scraper execution completed successfully

## Immediate Response

1. **Verify Degradation**
   - Check last 3-5 runs for the marketplace
   - Confirm zero results from all sources
   - Review duration_ms (should be normal, not timeout)

2. **Check Marketplace Status**
   - Visit marketplace website directly
   - Verify site is accessible
   - Check for maintenance announcements
   - Review marketplace changelog/updates

3. **Investigate Root Cause**
   - Use Operator Agent: "Why is [marketplace] degraded?"
   - Review recent selector changes
   - Check for DOM structure changes
   - Verify bot detection patterns

## Common Causes

### DOM Structure Changes
- **Symptom**: Page loads successfully, but selectors find nothing
- **Solution**: Update selectors to match new structure
- **Prevention**: Monitor marketplace UI updates

### Bot Detection (Silent)
- **Symptom**: Page loads but returns empty results
- **Solution**: Switch to Apify, rotate IPs, reduce frequency
- **Prevention**: Use Apify as primary source

### Network Issues
- **Symptom**: Partial page loads, timeouts
- **Solution**: Retry with backoff, check connectivity
- **Prevention**: Monitor network health

### Marketplace Changes
- **Symptom**: Sudden degradation across all sources
- **Solution**: Review marketplace API/docs for changes
- **Prevention**: Subscribe to marketplace update channels

## Resolution Steps

1. **Temporary Disable** (if critical)
   - Create change request to disable marketplace
   - Prevents wasted scraping resources
   - Can be re-enabled after fix

2. **Selector Update** (if DOM drift)
   - Identify new selector patterns
   - Test selectors in sandbox
   - Deploy updated selectors
   - Monitor for resolution

3. **Source Switch** (if bot detection)
   - Prefer Apify if DIY is blocked
   - Verify Apify actor is working
   - Monitor Apify success rate

4. **Configuration Adjust** (if rate limiting)
   - Reduce scraping frequency
   - Increase delays between requests
   - Review rate limit settings

## Monitoring

After resolution:
- Monitor next 5-10 runs
- Verify success rate returns to normal
- Track anomaly frequency
- Document resolution for future reference

## Prevention

- Regular health checks
- Automated selector validation
- Monitor marketplace changelogs
- Maintain multiple sources (Apify + DIY)

