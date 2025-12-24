# General Anomaly Response Runbook

## Overview

This runbook covers general procedures for responding to scraping anomalies detected by the Magnus Flipper system.

## Anomaly Types

### ZERO_RESULTS
- **Description**: Scraper returns zero items with no errors
- **Common Causes**:
  - DOM structure changes (selector drift)
  - Bot detection (silent blocking)
  - Marketplace layout updates
  - Network issues (partial page load)
- **Response**:
  1. Check if both Apify and DIY sources failed
  2. Verify page load success (check duration_ms)
  3. Review recent selector changes
  4. Check for marketplace announcements

### PARSING_NOISE
- **Description**: Scraper returns items but with high noise/invalid data
- **Common Causes**:
  - UI elements captured instead of listings
  - Advertisements mixed with results
  - Pagination artifacts
- **Response**:
  1. Review sample scraped data
  2. Check normalization filters
  3. Update parsing selectors if needed

### BOT_BLOCK
- **Description**: Explicit bot detection/blocking
- **Common Causes**:
  - Rate limiting triggered
  - IP reputation issues
  - User-agent detection
- **Response**:
  1. Switch to Apify (if not already)
  2. Reduce scraping frequency
  3. Review proxy/IP rotation

### TIMEOUT
- **Description**: Scraper exceeds timeout threshold
- **Common Causes**:
  - Slow marketplace response
  - Network issues
  - Heavy page load
- **Response**:
  1. Increase timeout if marketplace is consistently slow
  2. Check network connectivity
  3. Verify marketplace status

### ERROR_SPIKE
- **Description**: Sudden increase in error rate
- **Common Causes**:
  - Marketplace API changes
  - Infrastructure issues
  - Configuration errors
- **Response**:
  1. Check error patterns
  2. Review recent deployments
  3. Verify configuration

### SOURCE_DEGRADED
- **Description**: One source (Apify or DIY) consistently underperforming
- **Common Causes**:
  - Source-specific issues
  - Configuration problems
  - Rate limiting
- **Response**:
  1. Compare source performance
  2. Review source-specific logs
  3. Consider disabling degraded source temporarily

## General Response Workflow

1. **Identify**: Review anomaly type and severity
2. **Investigate**: Check telemetry (runs, anomalies, decisions)
3. **Diagnose**: Use Operator Agent to explain root cause
4. **Respond**: Apply appropriate fix based on anomaly type
5. **Monitor**: Track resolution and verify fix effectiveness

## Escalation Criteria

- **Low**: Single occurrence, no impact
- **Medium**: Multiple occurrences, minor impact
- **High**: Frequent occurrences, significant impact
- **Critical**: System-wide failure, immediate action required

## Prevention

- Regular selector health checks
- Monitor marketplace changelogs
- Maintain fallback sources
- Track anomaly trends over time

