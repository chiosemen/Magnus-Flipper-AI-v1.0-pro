# Phase 14C.1 — Proxy Launch Playbook

**Version**: 1.0  
**Last Updated**: 2025-01-15  
**Purpose**: Production-ready playbook for launching proxy integration with BrightData (primary) and Oxylabs (failover)

---

## Table of Contents

1. [BrightData First-Integration Playbook](#1-brightdata-first-integration-playbook)
2. [Oxylabs Second-Lane Integration](#2-oxylabs-second-lane-integration)
3. [Full Rollback Checklist](#3-full-rollback-checklist)
4. [Safe Proxy Rollout Ladder](#4-safe-proxy-rollout-ladder)
5. [Visual Sequence Diagrams](#5-visual-sequence-diagrams)
6. [Appendix](#6-appendix)

---

## 1. BrightData First-Integration Playbook

### A. Recommended BrightData Product

#### Primary Recommendation: Residential Proxy Network

**Product**: BrightData Residential Proxy Network (rotating)

**Why Residential:**
- **Marketplace Compatibility**: Most marketplaces (Facebook, Vinted, Gumtree) detect and block datacenter IPs aggressively
- **Session Persistence**: Residential IPs appear as real user traffic, reducing ban risk
- **Geographic Targeting**: Precise country/region targeting matches marketplace requirements
- **Success Rate**: Higher success rate for marketplace scraping vs datacenter proxies

**When to Use ISP Proxies:**
- **High-Volume Scenarios**: When you need higher throughput (ISP proxies have better bandwidth)
- **Lower-Risk Marketplaces**: eBay, Craigslist (less aggressive anti-bot measures)
- **Cost Optimization**: ISP proxies are typically cheaper per GB

**Session Management Best Practices:**
- **Sticky Sessions**: Use BrightData's session persistence for marketplaces requiring login state
- **Session Duration**: 5-10 minutes per session for most marketplaces
- **Rotation Strategy**: Rotate after 50-100 requests per IP (configurable via `maxRequestsPerIp`)

**Country Targeting:**
- **Facebook Marketplace**: Match user's location (GB, US, DE, etc.)
- **Vinted**: Primary regions (DE, FR, UK, US)
- **Gumtree**: GB, AU, IE
- **Craigslist**: US cities (varies by subdomain)
- **eBay**: Global (US, GB, DE, AU)

### B. Required Environment Variables

#### Global Proxy Configuration

```bash
# Enable proxy layer globally
USE_PROXIES=true

# BrightData provider identification
PROXY_PROVIDER_NAME="brightdata"

# BrightData Residential Proxy endpoint
# Format: http://zproxy.lum-superproxy.com:22225
PROXY_BASE_URL="http://zproxy.lum-superproxy.com:22225"

# BrightData authentication (Basic Auth)
# Username format: brd-customer-{CUSTOMER_ID}
# Password: {ZONE_PASSWORD}
PROXY_USERNAME="brd-customer-{CUSTOMER_ID}"
PROXY_PASSWORD="{ZONE_PASSWORD}"

# Optional: Token-based auth (if using BrightData API tokens)
# PROXY_AUTH_TOKEN=""

# Default region (fallback if marketplace-specific not set)
PROXY_DEFAULT_REGION="GB"
```

#### Marketplace-Specific Configuration

```bash
# Facebook Marketplace
PROXY_FB_ENABLED=true
PROXY_FB_REGION="GB"  # or "US", "DE", etc.

# Vinted
PROXY_VINTED_ENABLED=true
PROXY_VINTED_REGION="DE"  # Primary Vinted market

# Gumtree
PROXY_GUMTREE_ENABLED=true
PROXY_GUMTREE_REGION="GB"

# Craigslist
PROXY_CRAIGSLIST_ENABLED=true
PROXY_CRAIGSLIST_REGION="US"

# eBay
PROXY_EBAY_ENABLED=true
PROXY_EBAY_REGION="US"

# Depop
PROXY_DEPOP_ENABLED=true
PROXY_DEPOP_REGION="GB"
```

#### BrightData Account Setup

1. **Create BrightData Account**: https://brightdata.com
2. **Create Residential Proxy Zone**:
   - Dashboard → Residential Proxies → Create Zone
   - Name: `magnus-flipper-production`
   - Type: Residential (rotating)
   - Countries: Select based on marketplace needs
3. **Get Credentials**:
   - Customer ID: Found in account settings
   - Zone Password: Generated when creating zone
   - Endpoint: `zproxy.lum-superproxy.com:22225` (standard residential endpoint)

### C. BrightData → Magnus Flipper Mapping

#### Request Flow

Our `proxyFetch()` function in `packages/core/src/proxy-http.ts` constructs requests as follows:

**Current Implementation Pattern:**
```typescript
const proxyUrl = `${provider.baseUrl}?url=${targetUrl}&country=${region}`;
```

**BrightData-Specific Mapping:**

BrightData uses a different URL pattern. We need to adjust the `proxyFetch()` implementation or use BrightData's format:

**Option 1: BrightData Standard Format (Recommended)**
```
http://{username}:{password}@zproxy.lum-superproxy.com:22225
```

With target URL passed via query parameter:
```
http://{username}:{password}@zproxy.lum-superproxy.com:22225?url={ENCODED_TARGET}&country={REGION}
```

**Option 2: BrightData Session Format**
For sticky sessions:
```
http://{username}-session-{session_id}:{password}@zproxy.lum-superproxy.com:22225
```

#### Authentication Style

**BrightData uses Basic Authentication** embedded in the URL:
- Format: `http://username:password@host:port`
- Our current implementation supports this via `PROXY_USERNAME` and `PROXY_PASSWORD`
- The `proxy-http.ts` code constructs Basic Auth header, but BrightData prefers URL-embedded auth

**Required Headers:**
```typescript
{
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
  "Accept": "application/json",
  "Accept-Language": "en-US,en;q=0.9"
}
```

**Note**: BrightData may require additional headers. Test with BrightData's recommended headers for your use case.

#### Timeout Suggestions

Based on marketplace response times and BrightData network latency:

```typescript
// Recommended timeout configuration
const PROXY_TIMEOUT_MS = 30000; // 30 seconds

// For high-risk marketplaces (Facebook, Vinted)
const HIGH_RISK_TIMEOUT_MS = 45000; // 45 seconds

// For low-risk marketplaces (eBay, Craigslist)
const LOW_RISK_TIMEOUT_MS = 20000; // 20 seconds
```

**Implementation Note**: Current `proxyFetch()` doesn't set explicit timeout. Consider adding:
```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), PROXY_TIMEOUT_MS);

const res = await fetch(proxyUrl, {
  ...opts,
  signal: controller.signal,
});
```

#### Concurrency Limits

Based on `MarketplaceProxyProfile` settings in `proxy-config.ts`:

| Marketplace | Risk Tier | Max Concurrency | Max Requests/IP |
|-------------|-----------|----------------|-----------------|
| Facebook   | High      | 4              | 50              |
| Vinted     | Medium    | 3              | 40              |
| Gumtree    | Medium    | 3              | 40              |
| Craigslist | Medium    | 3              | 40              |
| eBay       | Low       | 5              | 60              |
| Depop      | Medium    | 3              | 40              |

**BrightData Limits:**
- Residential proxies: ~100 concurrent connections per zone (varies by plan)
- Rate limits: Check your BrightData plan limits
- IP rotation: Automatic after session timeout or manual via API

### D. Anti-Ban Strategy

#### Session Rotation Strategy

**Automatic Rotation:**
- BrightData rotates IPs automatically after session timeout (default: 10 minutes)
- Manual rotation: Use BrightData API to force IP change

**Manual Rotation Pattern:**
```typescript
// After maxRequestsPerIp requests, force new session
if (requestCount >= profile.maxRequestsPerIp) {
  // Generate new session ID
  const sessionId = generateSessionId();
  // Update proxy URL with new session
  proxyUrl = `${baseUrl}-session-${sessionId}?url=${targetUrl}`;
}
```

**Implementation in `proxy-http.ts`:**
Currently, our implementation doesn't track request counts per IP. Consider adding:
- Request counter per marketplace
- Session ID generation
- Automatic rotation trigger

#### Country Rotation

**Strategy:**
- **Primary Country**: Use marketplace's primary region (e.g., DE for Vinted)
- **Fallback Countries**: Rotate through secondary countries if primary fails
- **Rotation Pattern**: Round-robin or random selection

**Example Configuration:**
```typescript
const countryRotation = {
  vinted: ["DE", "FR", "UK", "US"],
  facebook: ["GB", "US", "DE"],
  gumtree: ["GB", "AU", "IE"]
};
```

#### Max Concurrency

**Per-Worker Limits:**
- Each worker instance respects `maxConcurrency` from `MarketplaceProxyProfile`
- Total system concurrency = `maxConcurrency × worker_replicas`

**Example:**
- 3 worker-scraper replicas
- Vinted `maxConcurrency: 3`
- Total Vinted concurrency: 9 simultaneous requests

**BrightData Considerations:**
- Monitor BrightData dashboard for connection limits
- Set `maxConcurrency` below BrightData's plan limits
- Implement queue system if exceeding limits

#### Retry Ladder

**Recommended Retry Strategy:**

```typescript
const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelays: [1000, 3000, 5000], // ms
  retryableErrors: [
    'ECONNRESET',
    'ETIMEDOUT',
    'ENOTFOUND',
    '503', // Service Unavailable
    '429'  // Too Many Requests
  ]
};
```

**Current Implementation:**
Our `proxyFetch()` doesn't implement retries. It falls back to direct fetch on error. Consider adding retry logic before fallback.

#### Detecting Proxy Failure vs Marketplace Block

**Proxy Failure Indicators:**
- HTTP 502, 503, 504 from proxy provider
- Connection timeout to proxy endpoint
- DNS resolution failure for proxy host
- Log event: `proxy_request_failed` with network error

**Marketplace Block Indicators:**
- HTTP 403, 429 from target marketplace (via proxy)
- HTTP 200 but empty response or CAPTCHA page
- Consistent failures for one marketplace but success for others
- Log event: `proxy_request_completed` with `status: 403` or `status: 429`

**Detection Logic:**
```typescript
if (response.status === 403 || response.status === 429) {
  // Likely marketplace block
  logger.warn("marketplace_block_detected", {
    marketplaceId,
    status: response.status,
    proxyUsed: true
  });
  // Consider: Rotate IP, increase delay, or pause scraping
} else if (response.status >= 500) {
  // Likely proxy failure
  logger.error("proxy_provider_error", {
    marketplaceId,
    status: response.status
  });
  // Fallback to direct fetch
}
```

---

## 2. Oxylabs Second-Lane Integration

### A. Environment Variable Switching

#### Oxylabs Configuration

```bash
# Switch provider to Oxylabs
USE_PROXIES=true
PROXY_PROVIDER_NAME="oxylabs"

# Oxylabs Residential Proxy endpoint
PROXY_BASE_URL="http://pr.oxylabs.io:7777"

# Oxylabs authentication
# Format: customer-{CUSTOMER_ID}
PROXY_USERNAME="customer-{CUSTOMER_ID}"
PROXY_PASSWORD="{PASSWORD}"

# Optional: Oxylabs doesn't use token auth
# PROXY_AUTH_TOKEN=""

# Default region
PROXY_DEFAULT_REGION="GB"
```

#### Marketplace-Specific (Same as BrightData)

```bash
PROXY_FB_ENABLED=true
PROXY_FB_REGION="GB"
# ... (same pattern for all marketplaces)
```

#### Oxylabs Account Setup

1. **Create Oxylabs Account**: https://oxylabs.io
2. **Create Residential Proxy Product**:
   - Dashboard → Products → Residential Proxies
   - Select countries/regions
   - Get credentials: Customer ID and Password
3. **Endpoint**: `pr.oxylabs.io:7777` (standard residential endpoint)

### B. Oxylabs Request Shape

#### Oxylabs URL Format

**Standard Format:**
```
http://customer-{CUSTOMER_ID}:{PASSWORD}@pr.oxylabs.io:7777
```

**With Target URL:**
```
http://customer-{CUSTOMER_ID}:{PASSWORD}@pr.oxylabs.io:7777?url={ENCODED_TARGET}
```

**With Country Parameter:**
```
http://customer-{CUSTOMER_ID}:{PASSWORD}@pr.oxylabs.io:7777?url={ENCODED_TARGET}&country={REGION}
```

#### Mapping to proxyFetch()

Our current `proxyFetch()` implementation works with Oxylabs with minimal changes:

**Current Pattern:**
```typescript
const proxyUrl = `${provider.baseUrl}?url=${targetUrl}&country=${region}`;
```

**Oxylabs-Compatible Pattern:**
```typescript
// Oxylabs supports URL-embedded auth (same as BrightData)
const authUrl = provider.username && provider.password
  ? `http://${provider.username}:${provider.password}@${provider.baseUrl.replace('http://', '')}`
  : provider.baseUrl;

const proxyUrl = `${authUrl}?url=${targetUrl}&country=${region}`;
```

**Note**: Current implementation uses Basic Auth header. Oxylabs prefers URL-embedded auth. Both work, but URL-embedded is more reliable.

#### Session/Country Parameters

**Oxylabs Session Management:**
- Sticky sessions: Add `session_id` parameter
- Country targeting: `country={ISO_CODE}` (e.g., `GB`, `US`, `DE`)
- City targeting: `city={CITY_NAME}` (optional)

**Example:**
```
http://customer-xxx:pass@pr.oxylabs.io:7777?url={TARGET}&country=GB&session_id={SESSION}
```

#### Rotation Rules

**Oxylabs Automatic Rotation:**
- IPs rotate automatically after session timeout
- Manual rotation: Change `session_id` parameter
- Country rotation: Change `country` parameter

**Recommended Settings:**
- Session duration: 10-15 minutes
- Rotation frequency: After 50-100 requests per IP
- Country: Match marketplace region

### C. Dual-Provider Strategy

#### Primary/Failover Pattern

**Strategy**: Run BrightData as primary, Oxylabs as failover

**Implementation Approach:**

**Option 1: Environment Variable Switch (Manual)**
- Set `PROXY_PROVIDER_NAME="brightdata"` for primary
- On BrightData outage: Change to `PROXY_PROVIDER_NAME="oxylabs"`
- Requires Container App restart/redeploy

**Option 2: Automatic Failover (Future Enhancement)**
- Implement provider health checking
- Automatically switch to Oxylabs if BrightData fails
- Requires code changes to `proxy-http.ts`

**Current State**: Manual switching via environment variables

**Failover Procedure:**
1. Detect BrightData issues (monitor logs for `proxy_request_failed`)
2. Update Azure Container App environment variables:
   ```bash
   az containerapp update \
     --name worker-scraper \
     --resource-group magnus-rg \
     --set-env-vars PROXY_PROVIDER_NAME=oxylabs \
                    PROXY_BASE_URL=http://pr.oxylabs.io:7777 \
                    PROXY_USERNAME=customer-{ID} \
                    PROXY_PASSWORD={PASSWORD}
   ```
3. Verify switch: Check logs for Oxylabs endpoint usage
4. Monitor success rate

#### Per-Marketplace Provider Split

**Strategy**: Use different providers for different marketplaces

**Example Configuration:**
- Facebook: BrightData (better success rate)
- Vinted: Oxylabs (better DE region coverage)
- eBay: BrightData (lower cost)
- Gumtree: Oxylabs (better GB coverage)

**Implementation Limitation:**
Current `proxy-config.ts` uses single `PROXY_PROVIDER_NAME` for all marketplaces. To support per-marketplace providers, we'd need to extend the config:

```typescript
// Future enhancement
interface MarketplaceProxyProfile {
  marketplaceId: string;
  enabled: boolean;
  providerName?: string; // Override global provider
  // ... existing fields
}
```

**Workaround**: Use separate worker instances with different provider configs per marketplace.

---

## 3. Full Rollback Checklist

### A. Disable All Proxies in Staging

#### Environment Variable Changes

**Quick Disable (All Marketplaces):**
```bash
USE_PROXIES=false
```

**Selective Disable (Per Marketplace):**
```bash
PROXY_FB_ENABLED=false
PROXY_VINTED_ENABLED=false
PROXY_GUMTREE_ENABLED=false
PROXY_CRAIGSLIST_ENABLED=false
PROXY_EBAY_ENABLED=false
PROXY_DEPOP_ENABLED=false
```

#### Azure Container App Update (Staging)

```bash
# Set environment variables
az containerapp update \
  --name worker-scraper-staging \
  --resource-group magnus-rg \
  --environment magnus-ca-env \
  --set-env-vars USE_PROXIES=false \
                 PROXY_FB_ENABLED=false \
                 PROXY_VINTED_ENABLED=false \
                 PROXY_GUMTREE_ENABLED=false \
                 PROXY_CRAIGSLIST_ENABLED=false \
                 PROXY_EBAY_ENABLED=false \
                 PROXY_DEPOP_ENABLED=false
```

**Verification:**
```bash
# Check environment variables
az containerapp show \
  --name worker-scraper-staging \
  --resource-group magnus-rg \
  --query "properties.template.containers[0].env" \
  --output table
```

### B. Disable All Proxies in Production

#### Production Rollback Command

```bash
# CRITICAL: Production rollback
az containerapp update \
  --name worker-scraper \
  --resource-group magnus-rg \
  --environment magnus-ca-env \
  --set-env-vars USE_PROXIES=false \
                 PROXY_FB_ENABLED=false \
                 PROXY_VINTED_ENABLED=false \
                 PROXY_GUMTREE_ENABLED=false \
                 PROXY_CRAIGSLIST_ENABLED=false \
                 PROXY_EBAY_ENABLED=false \
                 PROXY_DEPOP_ENABLED=false
```

**Force Redeploy (if env vars don't take effect):**
```bash
# Trigger new revision
az containerapp revision restart \
  --name worker-scraper \
  --resource-group magnus-rg
```

#### GitHub Actions Environment Override

If using GitHub Actions for deployment:

```bash
# Update GitHub repository secrets (if using)
# Or update workflow file to set USE_PROXIES=false
```

**Vercel Environment Override (for monitoring dashboard):**
```bash
# If monitoring dashboard uses proxies (unlikely)
vercel env rm USE_PROXIES production
```

### C. Verify Rollback Succeeded

#### Log Monitoring

**Check for Proxy Disable Events:**
```bash
# Azure Log Analytics query
ContainerAppConsoleLogs_CL
| where TimeGenerated > ago(10m)
| where Log_s contains "proxy_disabled_or_unavailable"
| where Log_s contains "provider_disabled"
| summarize count() by bin(TimeGenerated, 1m)
```

**Expected Log Pattern:**
```json
{
  "level": "info",
  "timestamp": "2025-01-15T12:00:00.000Z",
  "worker": "proxy-layer",
  "message": "proxy_disabled_or_unavailable",
  "metadata": {
    "marketplaceId": "vinted",
    "reason": "provider_disabled"
  }
}
```

#### Confirm Direct Fetch Usage

**Check for Successful Scrapes (Direct Mode):**
```bash
# Log Analytics query
ContainerAppConsoleLogs_CL
| where TimeGenerated > ago(10m)
| where Log_s contains "worker-scraper"
| where Log_s contains "Marketplace scraper completed"
| where Log_s contains "totalScraped"
| project TimeGenerated, Log_s
```

**Expected Behavior:**
- No `proxy_request_completed` events
- No `proxy_request_failed` events
- Scraper continues normally with direct fetch
- `totalScraped` values remain normal

#### Azure Dashboard Verification

**Container App Metrics:**
1. Navigate to Azure Portal → Container Apps → worker-scraper
2. Check **Metrics** tab:
   - **HTTP Requests**: Should show normal request rate
   - **Replica Count**: Should be stable
   - **CPU/Memory**: Should be normal
3. Check **Logs** tab:
   - Filter for "proxy" → Should show "proxy_disabled_or_unavailable"
   - Filter for "scraper" → Should show normal scraping activity

**Health Check:**
```bash
# Test health endpoint
curl https://worker-scraper.{your-domain}/health

# Expected: {"healthy": true, "checks": {...}}
```

### D. Fast Manual Rollback Command Set

#### Complete Rollback Script

```bash
#!/bin/bash
# emergency-rollback.sh
# Disables all proxies in staging and production

set -e

RESOURCE_GROUP="magnus-rg"
STAGING_APP="worker-scraper-staging"
PROD_APP="worker-scraper"
ENV_NAME="magnus-ca-env"

echo "🚨 EMERGENCY ROLLBACK: Disabling all proxies"

# Staging
echo "Disabling proxies in staging..."
az containerapp update \
  --name $STAGING_APP \
  --resource-group $RESOURCE_GROUP \
  --environment $ENV_NAME \
  --set-env-vars USE_PROXIES=false \
                 PROXY_FB_ENABLED=false \
                 PROXY_VINTED_ENABLED=false \
                 PROXY_GUMTREE_ENABLED=false \
                 PROXY_CRAIGSLIST_ENABLED=false \
                 PROXY_EBAY_ENABLED=false \
                 PROXY_DEPOP_ENABLED=false

# Production
echo "Disabling proxies in production..."
az containerapp update \
  --name $PROD_APP \
  --resource-group $RESOURCE_GROUP \
  --environment $ENV_NAME \
  --set-env-vars USE_PROXIES=false \
                 PROXY_FB_ENABLED=false \
                 PROXY_VINTED_ENABLED=false \
                 PROXY_GUMTREE_ENABLED=false \
                 PROXY_CRAIGSLIST_ENABLED=false \
                 PROXY_EBAY_ENABLED=false \
                 PROXY_DEPOP_ENABLED=false

echo "✅ Rollback complete. Verifying..."

# Wait for propagation
sleep 10

# Verify
echo "Checking staging logs..."
az monitor log-analytics query \
  --workspace {LOG_ANALYTICS_WORKSPACE_ID} \
  --analytics-query "ContainerAppConsoleLogs_CL | where TimeGenerated > ago(5m) | where Log_s contains 'proxy_disabled_or_unavailable' | summarize count()" \
  --output table

echo "✅ Rollback verified. Monitor logs for 5 minutes to confirm normal operation."
```

#### Single-Command Rollback (Production Only)

```bash
# One-liner for production rollback
az containerapp update --name worker-scraper --resource-group magnus-rg --environment magnus-ca-env --set-env-vars USE_PROXIES=false PROXY_FB_ENABLED=false PROXY_VINTED_ENABLED=false PROXY_GUMTREE_ENABLED=false PROXY_CRAIGSLIST_ENABLED=false PROXY_EBAY_ENABLED=false PROXY_DEPOP_ENABLED=false && az containerapp revision restart --name worker-scraper --resource-group magnus-rg
```

#### GitHub Actions Rollback

If proxies are controlled via GitHub Actions:

1. **Update workflow file** (`.github/workflows/deploy-workers.yml`):
   ```yaml
   env:
     USE_PROXIES: false
   ```

2. **Or create emergency rollback workflow**:
   ```yaml
   name: Emergency Proxy Rollback
   on:
     workflow_dispatch:
   jobs:
     rollback:
       runs-on: ubuntu-latest
       steps:
         - uses: azure/login@v1
           with:
             creds: ${{ secrets.AZURE_CREDENTIALS }}
         - run: |
             az containerapp update \
               --name worker-scraper \
               --resource-group magnus-rg \
               --set-env-vars USE_PROXIES=false
   ```

---

## 4. Safe Proxy Rollout Ladder

### Step 1 — Enable Proxies in Staging Only (Controlled Test)

#### Environment Configuration

**Staging Environment Variables:**
```bash
# Global proxy enable
USE_PROXIES=true

# Provider configuration
PROXY_PROVIDER_NAME="brightdata"
PROXY_BASE_URL="http://zproxy.lum-superproxy.com:22225"
PROXY_USERNAME="brd-customer-{CUSTOMER_ID}"
PROXY_PASSWORD="{ZONE_PASSWORD}"
PROXY_DEFAULT_REGION="GB"

# Enable for ONE marketplace only (Facebook)
PROXY_FB_ENABLED=true
PROXY_FB_REGION="GB"

# Keep all others disabled
PROXY_VINTED_ENABLED=false
PROXY_GUMTREE_ENABLED=false
PROXY_CRAIGSLIST_ENABLED=false
PROXY_EBAY_ENABLED=false
PROXY_DEPOP_ENABLED=false
```

#### Apply to Staging

```bash
az containerapp update \
  --name worker-scraper-staging \
  --resource-group magnus-rg \
  --environment magnus-ca-env \
  --set-env-vars USE_PROXIES=true \
                 PROXY_PROVIDER_NAME=brightdata \
                 PROXY_BASE_URL=http://zproxy.lum-superproxy.com:22225 \
                 PROXY_USERNAME=brd-customer-{CUSTOMER_ID} \
                 PROXY_PASSWORD={ZONE_PASSWORD} \
                 PROXY_DEFAULT_REGION=GB \
                 PROXY_FB_ENABLED=true \
                 PROXY_FB_REGION=GB \
                 PROXY_VINTED_ENABLED=false \
                 PROXY_GUMTREE_ENABLED=false \
                 PROXY_CRAIGSLIST_ENABLED=false \
                 PROXY_EBAY_ENABLED=false \
                 PROXY_DEPOP_ENABLED=false
```

#### Verification

**Wait 2-3 minutes for Container App to restart**, then verify:
```bash
# Check environment variables
az containerapp show \
  --name worker-scraper-staging \
  --resource-group magnus-rg \
  --query "properties.template.containers[0].env[?name=='USE_PROXIES' || name=='PROXY_FB_ENABLED']" \
  --output table
```

### Step 2 — Observe Logs

#### Log Monitoring Specifications

**Exact Event Names** (from `proxy-http.ts`):

1. **`proxy_disabled_or_unavailable`**
   - Triggered when proxies are disabled or marketplace not enabled
   - Metadata: `{ marketplaceId, reason }`
   - Expected: Should NOT appear for Facebook (enabled), SHOULD appear for others

2. **`proxy_request_completed`**
   - Triggered on successful proxy request
   - Metadata: `{ marketplaceId, status, elapsedMs }`
   - Expected: Should appear for Facebook requests

3. **`proxy_request_failed`**
   - Triggered on proxy request failure
   - Metadata: `{ marketplaceId, elapsedMs }`
   - Error object: Contains error details
   - Expected: Should be rare (< 5% of requests)

4. **`proxy_fallback_to_direct`**
   - Triggered when proxy fails and falls back to direct fetch
   - Metadata: `{ marketplaceId }`
   - Expected: Should be rare (< 1% of requests)

5. **`scrape_completed_direct`** (from worker-scraper)
   - Not a proxy event, but indicates direct fetch usage
   - Expected: Should appear for non-Facebook marketplaces

6. **`scrape_completed_via_proxy`** (from worker-scraper)
   - Not currently logged, but could be added
   - Would indicate successful proxy usage

#### Log Analytics Queries

**Query 1: Proxy Enable Status**
```kusto
ContainerAppConsoleLogs_CL
| where TimeGenerated > ago(15m)
| where Log_s contains "proxy_disabled_or_unavailable"
| parse Log_s with * "\"marketplaceId\":\"" MarketplaceId "\"" *
| parse Log_s with * "\"reason\":\"" Reason "\"" *
| summarize count() by MarketplaceId, Reason
| order by MarketplaceId
```

**Query 2: Proxy Request Success Rate**
```kusto
ContainerAppConsoleLogs_CL
| where TimeGenerated > ago(15m)
| where Log_s contains "proxy_request_completed"
| parse Log_s with * "\"marketplaceId\":\"" MarketplaceId "\"" *
| parse Log_s with * "\"status\":" Status:long *
| summarize 
    Total = count(),
    Success = countif(Status >= 200 and Status < 300),
    Failed = countif(Status >= 400)
    by MarketplaceId
| extend SuccessRate = todouble(Success) / todouble(Total) * 100
| project MarketplaceId, Total, Success, Failed, SuccessRate
```

**Query 3: Proxy Request Failures**
```kusto
ContainerAppConsoleLogs_CL
| where TimeGenerated > ago(15m)
| where Log_s contains "proxy_request_failed"
| parse Log_s with * "\"marketplaceId\":\"" MarketplaceId "\"" *
| parse Log_s with * "\"message\":\"" ErrorMessage "\"" *
| summarize count() by MarketplaceId, ErrorMessage
| order by count_ desc
```

**Query 4: Fallback to Direct Fetch**
```kusto
ContainerAppConsoleLogs_CL
| where TimeGenerated > ago(15m)
| where Log_s contains "proxy_fallback_to_direct"
| parse Log_s with * "\"marketplaceId\":\"" MarketplaceId "\"" *
| summarize FallbackCount = count() by MarketplaceId, bin(TimeGenerated, 5m)
| order by TimeGenerated desc
```

**Query 5: Scraper Completion Status**
```kusto
ContainerAppConsoleLogs_CL
| where TimeGenerated > ago(15m)
| where Log_s contains "Marketplace scraper completed"
| parse Log_s with * "\"marketplace\":\"" Marketplace "\"" *
| parse Log_s with * "\"totalScraped\":" TotalScraped:long *
| parse Log_s with * "\"success\":" Success:bool *
| summarize 
    TotalRuns = count(),
    SuccessfulRuns = countif(Success == true),
    TotalItemsScraped = sum(TotalScraped)
    by Marketplace
| extend SuccessRate = todouble(SuccessfulRuns) / todouble(TotalRuns) * 100
```

#### Success Criteria

**For Step 2 (Staging with Facebook only):**

✅ **Success Indicators:**
- `proxy_request_completed` events appear for Facebook
- Success rate > 95% (status 200-299)
- `proxy_request_failed` < 5% of total requests
- `proxy_fallback_to_direct` < 1% of total requests
- Facebook scraper completes successfully
- Total items scraped for Facebook remains normal

❌ **Failure Indicators:**
- `proxy_request_failed` > 10% of requests
- Consistent 403/429 status codes (marketplace blocking)
- Scraper failure rate increases
- Total items scraped drops significantly
- High latency (elapsedMs > 10000ms consistently)

**Action on Failure:**
- Immediately disable proxies (Step 4: Revert to Safe Mode)
- Investigate logs for root cause
- Check BrightData dashboard for account issues
- Verify proxy credentials are correct

### Step 3 — Ask External Testers to Verify Functionality

#### Tester Verification Checklist

**Provide testers with:**

1. **Staging Environment URL**: `https://staging.magnusflipper.ai` (or your staging URL)
2. **Test Accounts**: If login required
3. **Verification Steps**:

**A. Search Load Test**
- Perform 5-10 searches for different products
- Verify results load within 3-5 seconds
- Check that results are relevant to search query
- Note any timeouts or errors

**B. Marketplace Results Verification**
- Check that Facebook Marketplace results appear
- Verify result quality (images, prices, descriptions)
- Confirm results are recent (within last 24 hours)
- Check that pagination works (if applicable)

**C. Real-Time Scraping Integrity**
- Create a new search query
- Wait 10-15 minutes
- Verify new listings appear for that query
- Check that duplicate listings are filtered correctly

**D. Performance Comparison**
- Compare staging (with proxies) vs production (without proxies)
- Note any differences in:
  - Load times
  - Result quality
  - Error rates
  - Missing listings

#### Tester Feedback Form

**Questions for Testers:**

1. **Search Functionality**: Does search work normally? (Yes/No/Issues)
2. **Result Quality**: Are results relevant and complete? (Yes/No/Issues)
3. **Performance**: Is the site responsive? (Fast/Normal/Slow)
4. **Errors**: Did you encounter any errors? (Yes/No - describe)
5. **Comparison**: How does staging compare to production? (Better/Same/Worse)

**Collect feedback for 24-48 hours before proceeding.**

### Step 4 — Revert to Safe Mode (Tomorrow Morning)

#### Revert Procedure

**If testing reveals issues OR after successful test period:**

```bash
# Disable proxies in staging
az containerapp update \
  --name worker-scraper-staging \
  --resource-group magnus-rg \
  --environment magnus-ca-env \
  --set-env-vars USE_PROXIES=false \
                 PROXY_FB_ENABLED=false
```

#### Verify Fallback

**Check logs for 10 minutes:**
```bash
# Log Analytics query
ContainerAppConsoleLogs_CL
| where TimeGenerated > ago(10m)
| where Log_s contains "proxy_disabled_or_unavailable"
| where Log_s contains "provider_disabled"
| summarize count() by bin(TimeGenerated, 1m)
```

**Expected:**
- `proxy_disabled_or_unavailable` events appear
- Scraper continues normally
- No increase in error rates
- Scraping success rate remains stable

#### Next Steps

**If Step 2-3 were successful:**
- Proceed to enable additional marketplaces (one at a time)
- Follow same process: Enable → Monitor → Test → Verify

**If Step 2-3 revealed issues:**
- Investigate root cause
- Fix configuration or code
- Retry from Step 1

### Step 5 — Gradual Marketplace Rollout

#### Rollout Sequence

**Recommended order (lowest risk first):**

1. **eBay** (Low risk tier)
   - Enable: `PROXY_EBAY_ENABLED=true`
   - Monitor for 24 hours
   - Verify success rate > 98%

2. **Gumtree** (Medium risk tier)
   - Enable: `PROXY_GUMTREE_ENABLED=true`
   - Monitor for 24 hours
   - Verify success rate > 95%

3. **Vinted** (Medium risk tier)
   - Enable: `PROXY_VINTED_ENABLED=true`
   - Monitor for 24 hours
   - Verify success rate > 95%

4. **Craigslist** (Medium risk tier)
   - Enable: `PROXY_CRAIGSLIST_ENABLED=true`
   - Monitor for 24 hours
   - Verify success rate > 95%

5. **Depop** (Medium risk tier)
   - Enable: `PROXY_DEPOP_ENABLED=true`
   - Monitor for 24 hours
   - Verify success rate > 95%

**Facebook** (High risk tier) - Already enabled in Step 1

#### Production Rollout

**After all marketplaces pass staging:**

1. **Enable in production** (same sequence as staging)
2. **Monitor closely** for first 48 hours
3. **Have rollback ready** (Section 3)
4. **Gradually increase confidence** over 1-2 weeks

---

## 5. Visual Sequence Diagrams

### A. BrightData Request Flow

```mermaid
sequenceDiagram
    participant Scraper as Vinted Scraper
    participant Proxy as proxyFetch()
    participant Config as proxy-config.ts
    participant BrightData as BrightData Proxy
    participant Vinted as Vinted API
    participant Logger as worker-logger

    Scraper->>Proxy: proxyFetch({marketplaceId: "vinted", url: "..."})
    Proxy->>Config: loadProxyProviderConfig()
    Config-->>Proxy: {enabled: true, baseUrl: "...", username: "...", password: "..."}
    Proxy->>Config: loadMarketplaceProxyProfiles()
    Config-->>Proxy: [{marketplaceId: "vinted", enabled: true, defaultRegion: "DE"}]
    
    alt Proxies Enabled
        Proxy->>Proxy: Construct proxyUrl: baseUrl?url={target}&country=DE
        Proxy->>Proxy: Add Basic Auth header
        Proxy->>Logger: Log start time
        Proxy->>BrightData: GET proxyUrl (with auth)
        
        alt BrightData Success
            BrightData->>Vinted: Forward request
            Vinted-->>BrightData: Response (200 OK)
            BrightData-->>Proxy: Response (200 OK)
            Proxy->>Logger: proxy_request_completed {status: 200, elapsedMs: 1234}
            Proxy-->>Scraper: Response object
        else BrightData Failure
            BrightData-->>Proxy: Error (timeout/503/etc)
            Proxy->>Logger: proxy_request_failed {error: "..."}
            Proxy->>Logger: proxy_fallback_to_direct
            Proxy->>Vinted: Direct fetch (fallback)
            Vinted-->>Proxy: Response
            Proxy-->>Scraper: Response object
        end
    else Proxies Disabled
        Proxy->>Logger: proxy_disabled_or_unavailable {reason: "provider_disabled"}
        Proxy->>Vinted: Direct fetch
        Vinted-->>Proxy: Response
        Proxy-->>Scraper: Response object
    end
```

### B. Fallback Logic

```mermaid
flowchart TD
    Start[proxyFetch called] --> CheckEnabled{USE_PROXIES = true?}
    CheckEnabled -->|No| LogDisabled[Log: proxy_disabled_or_unavailable]
    LogDisabled --> DirectFetch1[Direct fetch to target]
    DirectFetch1 --> Return1[Return response]
    
    CheckEnabled -->|Yes| CheckProfile{Marketplace profile enabled?}
    CheckProfile -->|No| LogDisabled
    CheckProfile -->|Yes| CheckBaseUrl{baseUrl configured?}
    CheckBaseUrl -->|No| LogDisabled
    CheckBaseUrl -->|Yes| BuildProxyUrl[Build proxy URL with auth]
    
    BuildProxyUrl --> MakeRequest[Make proxy request]
    MakeRequest --> CheckResponse{Response OK?}
    
    CheckResponse -->|Yes 200-299| LogSuccess[Log: proxy_request_completed]
    LogSuccess --> Return2[Return response]
    
    CheckResponse -->|No Error| LogError[Log: proxy_request_failed]
    LogError --> LogFallback[Log: proxy_fallback_to_direct]
    LogFallback --> DirectFetch2[Direct fetch to target]
    DirectFetch2 --> Return3[Return response]
    
    Return1 --> End[End]
    Return2 --> End
    Return3 --> End
```

### C. Error Propagation

```mermaid
sequenceDiagram
    participant Marketplace as Marketplace API
    participant Proxy as BrightData Proxy
    participant proxyFetch as proxyFetch()
    participant Scraper as Vinted Scraper
    participant Logger as worker-logger
    participant Monitor as Azure Monitor

    Note over Marketplace,Proxy: Normal Flow
    proxyFetch->>Proxy: Request via proxy
    Proxy->>Marketplace: Forward request
    Marketplace-->>Proxy: 200 OK
    Proxy-->>proxyFetch: 200 OK
    proxyFetch->>Logger: proxy_request_completed
    Logger->>Monitor: Structured log
    proxyFetch-->>Scraper: Success
    
    Note over Marketplace,Proxy: Marketplace Block
    proxyFetch->>Proxy: Request via proxy
    Proxy->>Marketplace: Forward request
    Marketplace-->>Proxy: 403 Forbidden (Blocked)
    Proxy-->>proxyFetch: 403 Forbidden
    proxyFetch->>Logger: proxy_request_completed {status: 403}
    Logger->>Monitor: Structured log (warning)
    proxyFetch-->>Scraper: 403 Response
    Scraper->>Scraper: Handle 403 (retry/rotate IP)
    
    Note over Marketplace,Proxy: Proxy Failure
    proxyFetch->>Proxy: Request via proxy
    Proxy-->>proxyFetch: Connection timeout
    proxyFetch->>Logger: proxy_request_failed {error: "ETIMEDOUT"}
    Logger->>Monitor: Structured log (error)
    proxyFetch->>Logger: proxy_fallback_to_direct
    proxyFetch->>Marketplace: Direct fetch (fallback)
    Marketplace-->>proxyFetch: 200 OK
    proxyFetch-->>Scraper: Success (via fallback)
    
    Note over Monitor: Alert Rules
    Monitor->>Monitor: Check error rate
    alt Error Rate > Threshold
        Monitor->>Monitor: Trigger alert
        Monitor->>Ops: Send notification
    end
```

### D. Observability Events

```mermaid
graph LR
    A[proxyFetch called] --> B{Event Type}
    
    B -->|Disabled| C[proxy_disabled_or_unavailable]
    B -->|Success| D[proxy_request_completed]
    B -->|Failure| E[proxy_request_failed]
    B -->|Fallback| F[proxy_fallback_to_direct]
    
    C --> G[Log Analytics]
    D --> G
    E --> G
    F --> G
    
    G --> H[KQL Queries]
    H --> I[Azure Monitor Alerts]
    H --> J[Dashboards]
    H --> K[Reports]
    
    I --> L[Email/Teams]
    I --> M[Webhook]
    
    style C fill:#f9f,stroke:#333,stroke-width:2px
    style D fill:#9f9,stroke:#333,stroke-width:2px
    style E fill:#f99,stroke:#333,stroke-width:2px
    style F fill:#ff9,stroke:#333,stroke-width:2px
```

---

## 6. Appendix

### A. Sample BrightData Request Logs

#### Success Log Entry

```json
{
  "level": "info",
  "timestamp": "2025-01-15T12:34:56.789Z",
  "worker": "proxy-layer",
  "correlationId": "1705324496789-abc123",
  "message": "proxy_request_completed",
  "metadata": {
    "marketplaceId": "vinted",
    "status": 200,
    "elapsedMs": 1234
  }
}
```

#### Failure Log Entry (Timeout)

```json
{
  "level": "error",
  "timestamp": "2025-01-15T12:35:10.123Z",
  "worker": "proxy-layer",
  "correlationId": "1705324510123-def456",
  "message": "proxy_request_failed",
  "metadata": {
    "marketplaceId": "facebook",
    "elapsedMs": 30000
  },
  "error": {
    "message": "fetch failed",
    "name": "TypeError",
    "stack": "TypeError: fetch failed\n    at async proxyFetch..."
  }
}
```

#### Fallback Log Entry

```json
{
  "level": "info",
  "timestamp": "2025-01-15T12:35:11.456Z",
  "worker": "proxy-layer",
  "correlationId": "1705324511456-ghi789",
  "message": "proxy_fallback_to_direct",
  "metadata": {
    "marketplaceId": "facebook"
  }
}
```

#### Disabled Log Entry

```json
{
  "level": "info",
  "timestamp": "2025-01-15T12:36:00.000Z",
  "worker": "proxy-layer",
  "correlationId": "1705324560000-jkl012",
  "message": "proxy_disabled_or_unavailable",
  "metadata": {
    "marketplaceId": "gumtree",
    "reason": "marketplace_profile_disabled"
  }
}
```

### B. Sample Error Logs

#### Marketplace Block (403)

```json
{
  "level": "info",
  "timestamp": "2025-01-15T12:40:00.000Z",
  "worker": "proxy-layer",
  "correlationId": "1705324800000-mno345",
  "message": "proxy_request_completed",
  "metadata": {
    "marketplaceId": "facebook",
    "status": 403,
    "elapsedMs": 890
  }
}
```

**Action**: Rotate IP, increase delay, or pause scraping for this marketplace.

#### Proxy Provider Down (503)

```json
{
  "level": "error",
  "timestamp": "2025-01-15T12:41:00.000Z",
  "worker": "proxy-layer",
  "correlationId": "1705324860000-pqr678",
  "message": "proxy_request_failed",
  "metadata": {
    "marketplaceId": "vinted",
    "elapsedMs": 5000
  },
  "error": {
    "message": "Service Unavailable",
    "name": "Error"
  }
}
```

**Action**: Check BrightData dashboard, switch to Oxylabs if persistent.

#### Timeout Error

```json
{
  "level": "error",
  "timestamp": "2025-01-15T12:42:00.000Z",
  "worker": "proxy-layer",
  "correlationId": "1705324920000-stu901",
  "message": "proxy_request_failed",
  "metadata": {
    "marketplaceId": "gumtree",
    "elapsedMs": 30000
  },
  "error": {
    "message": "The operation was aborted",
    "name": "AbortError"
  }
}
```

**Action**: Increase timeout, check network connectivity, or retry with different IP.

### C. KQL Queries for Log Analytics

#### Query 1: Proxy Usage Summary (Last 24 Hours)

```kusto
ContainerAppConsoleLogs_CL
| where TimeGenerated > ago(24h)
| where Log_s contains "proxy"
| extend LogJson = parse_json(Log_s)
| extend Message = tostring(LogJson.message)
| extend MarketplaceId = tostring(LogJson.metadata.marketplaceId)
| extend Status = toint(LogJson.metadata.status)
| extend ElapsedMs = toint(LogJson.metadata.elapsedMs)
| summarize 
    TotalRequests = countif(Message == "proxy_request_completed"),
    FailedRequests = countif(Message == "proxy_request_failed"),
    FallbackCount = countif(Message == "proxy_fallback_to_direct"),
    AvgLatency = avgif(ElapsedMs, Message == "proxy_request_completed"),
    SuccessRate = todouble(countif(Message == "proxy_request_completed" and Status >= 200 and Status < 300)) / todouble(countif(Message == "proxy_request_completed")) * 100
    by MarketplaceId, bin(TimeGenerated, 1h)
| order by TimeGenerated desc
```

#### Query 2: Proxy Error Rate by Marketplace

```kusto
ContainerAppConsoleLogs_CL
| where TimeGenerated > ago(1h)
| where Log_s contains "proxy_request"
| extend LogJson = parse_json(Log_s)
| extend Message = tostring(LogJson.message)
| extend MarketplaceId = tostring(LogJson.metadata.marketplaceId)
| extend Status = toint(LogJson.metadata.status)
| summarize 
    Total = count(),
    Success = countif(Message == "proxy_request_completed" and Status >= 200 and Status < 300),
    Failed = countif(Message == "proxy_request_failed"),
    Blocked = countif(Message == "proxy_request_completed" and (Status == 403 or Status == 429))
    by MarketplaceId
| extend ErrorRate = todouble(Failed + Blocked) / todouble(Total) * 100
| extend SuccessRate = todouble(Success) / todouble(Total) * 100
| project MarketplaceId, Total, Success, Failed, Blocked, SuccessRate, ErrorRate
| order by ErrorRate desc
```

#### Query 3: Proxy Latency Distribution

```kusto
ContainerAppConsoleLogs_CL
| where TimeGenerated > ago(24h)
| where Log_s contains "proxy_request_completed"
| extend LogJson = parse_json(Log_s)
| extend MarketplaceId = tostring(LogJson.metadata.marketplaceId)
| extend ElapsedMs = toint(LogJson.metadata.elapsedMs)
| summarize 
    Count = count(),
    P50 = percentile(ElapsedMs, 50),
    P75 = percentile(ElapsedMs, 75),
    P90 = percentile(ElapsedMs, 90),
    P95 = percentile(ElapsedMs, 95),
    P99 = percentile(ElapsedMs, 99),
    Max = max(ElapsedMs),
    Avg = avg(ElapsedMs)
    by MarketplaceId
| order by Avg desc
```

#### Query 4: Fallback Frequency Analysis

```kusto
ContainerAppConsoleLogs_CL
| where TimeGenerated > ago(24h)
| where Log_s contains "proxy_fallback_to_direct"
| extend LogJson = parse_json(Log_s)
| extend MarketplaceId = tostring(LogJson.metadata.marketplaceId)
| summarize FallbackCount = count() by MarketplaceId, bin(TimeGenerated, 1h)
| order by TimeGenerated desc, FallbackCount desc
```

#### Query 5: Proxy vs Direct Fetch Comparison

```kusto
let ProxyRequests = ContainerAppConsoleLogs_CL
| where TimeGenerated > ago(24h)
| where Log_s contains "proxy_request_completed"
| extend LogJson = parse_json(Log_s)
| extend MarketplaceId = tostring(LogJson.metadata.marketplaceId)
| extend ElapsedMs = toint(LogJson.metadata.elapsedMs)
| extend RequestType = "proxy"
| project TimeGenerated, MarketplaceId, ElapsedMs, RequestType;

let DirectRequests = ContainerAppConsoleLogs_CL
| where TimeGenerated > ago(24h)
| where Log_s contains "proxy_fallback_to_direct"
| extend LogJson = parse_json(Log_s)
| extend MarketplaceId = tostring(LogJson.metadata.marketplaceId)
| extend ElapsedMs = 0  // Direct requests don't log latency in proxy layer
| extend RequestType = "direct"
| project TimeGenerated, MarketplaceId, ElapsedMs, RequestType;

union ProxyRequests, DirectRequests
| summarize 
    ProxyCount = countif(RequestType == "proxy"),
    DirectCount = countif(RequestType == "direct"),
    AvgProxyLatency = avgif(ElapsedMs, RequestType == "proxy")
    by MarketplaceId, bin(TimeGenerated, 1h)
| extend ProxyRatio = todouble(ProxyCount) / todouble(ProxyCount + DirectCount) * 100
| order by TimeGenerated desc
```

#### Query 6: Alert Query - High Proxy Failure Rate

```kusto
// Use this in Azure Monitor Alert Rule
ContainerAppConsoleLogs_CL
| where TimeGenerated > ago(15m)
| where Log_s contains "proxy_request"
| extend LogJson = parse_json(Log_s)
| extend Message = tostring(LogJson.message)
| extend MarketplaceId = tostring(LogJson.metadata.marketplaceId)
| summarize 
    Total = count(),
    Failed = countif(Message == "proxy_request_failed")
    by MarketplaceId
| extend FailureRate = todouble(Failed) / todouble(Total) * 100
| where FailureRate > 10  // Alert if > 10% failure rate
| project MarketplaceId, Total, Failed, FailureRate
```

### D. Blue/Green Proxy Rollout Strategy

#### Overview

Blue/Green deployment pattern for proxy integration allows zero-downtime rollout with instant rollback capability.

#### Architecture

```
┌─────────────────────────────────────────────────────────┐
│              Azure Container Apps Environment           │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐         ┌──────────────┐            │
│  │  Blue Stack  │         │ Green Stack  │            │
│  │ (No Proxies) │         │ (With Proxies)│            │
│  │              │         │              │            │
│  │ worker-      │         │ worker-      │            │
│  │ scraper-blue │         │ scraper-green│            │
│  │              │         │              │            │
│  │ Traffic: 100%│         │ Traffic: 0% │            │
│  └──────────────┘         └──────────────┘            │
│         │                          │                    │
│         └──────────┬───────────────┘                    │
│                    │                                     │
│            ┌───────▼────────┐                          │
│            │  Traffic Split  │                          │
│            │   (Azure LB)    │                          │
│            └─────────────────┘                          │
└─────────────────────────────────────────────────────────┘
```

#### Implementation Steps

**Step 1: Create Green Stack**
```bash
# Deploy green stack with proxies enabled
az containerapp create \
  --name worker-scraper-green \
  --resource-group magnus-rg \
  --environment magnus-ca-env \
  --image {ACR}/worker-scraper:latest \
  --set-env-vars USE_PROXIES=true \
                 PROXY_PROVIDER_NAME=brightdata \
                 # ... other proxy vars
```

**Step 2: Test Green Stack**
- Send test traffic to green stack (10% traffic)
- Monitor logs and metrics
- Verify proxy functionality

**Step 3: Gradual Traffic Shift**
```bash
# Shift 10% traffic to green
az containerapp ingress traffic set \
  --name worker-scraper \
  --resource-group magnus-rg \
  --revision-weight worker-scraper-green=10 worker-scraper-blue=90

# Monitor for 1 hour, then shift to 25%
az containerapp ingress traffic set \
  --name worker-scraper \
  --resource-group magnus-rg \
  --revision-weight worker-scraper-green=25 worker-scraper-blue=75

# Continue: 50%, 75%, 100%
```

**Step 4: Rollback (if needed)**
```bash
# Instant rollback: Shift all traffic back to blue
az containerapp ingress traffic set \
  --name worker-scraper \
  --resource-group magnus-rg \
  --revision-weight worker-scraper-green=0 worker-scraper-blue=100
```

**Step 5: Cleanup**
```bash
# After successful rollout, remove blue stack
az containerapp delete \
  --name worker-scraper-blue \
  --resource-group magnus-rg \
  --yes

# Rename green to production
az containerapp update \
  --name worker-scraper-green \
  --resource-group magnus-rg \
  --set-env-vars PRODUCTION=true
```

#### Benefits

- **Zero Downtime**: Traffic shifts gradually
- **Instant Rollback**: Shift traffic back in seconds
- **A/B Testing**: Compare proxy vs direct performance
- **Risk Mitigation**: Test in production with limited traffic

#### Limitations

- Requires Azure Container Apps traffic splitting (available in newer versions)
- More complex setup and monitoring
- Higher resource costs (running two stacks)

#### Alternative: Canary Deployment

If traffic splitting isn't available, use canary pattern:
- Deploy new revision with proxies
- Monitor new revision separately
- Promote to 100% traffic after validation
- Keep old revision as backup

---

## Conclusion

This playbook provides comprehensive guidance for launching proxy integration in Magnus Flipper. Follow the rollout ladder carefully, monitor logs closely, and be prepared to rollback at any time.

**Key Takeaways:**
1. Start with staging and one marketplace
2. Monitor logs continuously
3. Have rollback ready
4. Gradual rollout reduces risk
5. BrightData primary, Oxylabs failover

**Support:**
- Check Azure Log Analytics for detailed logs
- Monitor BrightData/Oxylabs dashboards for provider health
- Use KQL queries in this playbook for troubleshooting

---

**End of Phase 14C.1 Proxy Launch Playbook**

