# Craigslist Selector Rehabilitation

## Overview

Craigslist frequently changes its DOM structure, causing selectors to break. This runbook covers identifying and fixing selector drift.

## Current Status

**Known Issue**: Craigslist selectors are currently broken (as of Phase 1)
- Zero results from DIY scraper
- No exceptions thrown (silent failure)
- Page loads successfully

## Detection

Signs of selector drift:
- Zero results with no errors
- Page loads successfully (duration_ms normal)
- Selectors return empty arrays
- No exceptions in logs

## Investigation Steps

1. **Verify Page Load**
   - Check duration_ms (should be normal, not timeout)
   - Verify HTTP status 200
   - Confirm page HTML is received

2. **Inspect DOM Structure**
   - Visit Craigslist search page directly
   - Inspect listing elements in browser DevTools
   - Note current selector patterns
   - Compare with existing selectors

3. **Test Selectors**
   - Run selectors in browser console
   - Verify they match listing elements
   - Check for multiple matches
   - Verify data extraction works

## Common Craigslist Changes

### Grid Layout Changes
- **Old**: `li.cl-search-result`
- **New**: May use different class names
- **Solution**: Update to new class names

### Listing Structure
- **Old**: Specific nested structure
- **New**: Flattened or different nesting
- **Solution**: Update selector paths

### Data Attributes
- **Old**: Specific data attributes
- **New**: Different or removed attributes
- **Solution**: Use alternative selectors

### Pagination
- **Old**: Specific pagination structure
- **New**: Infinite scroll or different pagination
- **Solution**: Update pagination logic

## Fix Procedure

1. **Identify New Selectors**
   - Use browser DevTools
   - Test in console
   - Verify data extraction

2. **Update Scraper Code**
   - Modify selector definitions
   - Update data extraction logic
   - Test in sandbox environment

3. **Validate Fix**
   - Run test scrape
   - Verify items are returned
   - Check data quality
   - Monitor for anomalies

4. **Deploy**
   - Deploy updated scraper
   - Monitor first few runs
   - Verify success rate improves

## Prevention

### Regular Health Checks
- Weekly selector validation
- Automated selector tests
- Monitor zero-result rates

### DOM Monitoring
- Track Craigslist UI updates
- Subscribe to changelogs
- Monitor community reports

### Fallback Strategies
- Use Apify as primary source
- Maintain multiple selector sets
- Implement selector versioning

## Testing

Before deploying fixes:
1. Test in sandbox environment
2. Verify selectors match listings
3. Check data extraction quality
4. Validate against known good data
5. Monitor for regressions

## Rollback Plan

If fix causes issues:
1. Revert to previous selector version
2. Investigate root cause
3. Test fix in isolation
4. Re-deploy after validation

## Current Selector Status

**Status**: Broken (as of Phase 1)
**Last Working**: Unknown
**Next Steps**: 
1. Inspect current DOM structure
2. Identify new selectors
3. Update scraper code
4. Test and deploy

