# Figma Metrics Plugin — Quick Start Guide

## Overview

The **Canary Metrics Sync** Figma plugin automatically pulls live canary deployment metrics from your API and updates Figma frames and components in real-time.

## Installation

### Development Setup

1. **Navigate to plugin directory:**
   ```bash
   cd figma-plugins/canary-metrics-sync
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Build the plugin:**
   ```bash
   npm run build
   ```

4. **Load in Figma:**
   - Open Figma Desktop app
   - Go to `Plugins → Development → Import plugin from manifest...`
   - Navigate to `figma-plugins/canary-metrics-sync/manifest.json`
   - Click "Import"

5. **Run the plugin:**
   - `Plugins → Development → Canary Metrics Sync`

## Configuration

### First-Time Setup

1. **Enter API URL:**
   - Production: `https://api.example.com/canary`
   - Staging: `https://staging-api.example.com/canary`
   - Local: `http://localhost:3000/api/canary`

2. **Add API Key (if required):**
   - Enter your Bearer token
   - Token is stored locally in Figma (never sent to external servers)

3. **Select Environment:**
   - Choose: Production, Staging, or Local

4. **Test Connection:**
   - Click "Test API Connection"
   - Verify you see "API connection successful"

5. **Save Configuration:**
   - Click "Save Configuration"
   - Config is stored in Figma's `clientStorage`

## Layer Naming Convention

The plugin automatically finds and updates layers based on their names. Use these exact names in your Figma file:

### Required Layers

| Layer Name | What It Updates | Example Value |
|-----------|----------------|---------------|
| `metric-canary-traffic` | Traffic split | "90% stable / 10% canary" |
| `metric-error-rate` | Error rate | "0.23% (12 errors)" |
| `metric-latency-p95` | P95 latency | "427 ms" |
| `metric-ml-decision` | ML decision | "PROMOTE (91%)" |
| `metric-health-score` | Health pass rate | "99.3% passing /health" |
| `metric-canary-revision` | Canary revision | "mf-worker-realtime@2025-12-09-01" |
| `metric-stable-revision` | Stable revision | "mf-worker-realtime@2025-12-08-05" |
| `metric-last-updated` | Last update time | "12/9/2025, 6:00:00 PM" |

### Status Color Updates

The plugin also updates fill colors for ML decision badges:

- **PROMOTE** → Green (`#22C55E`)
- **ROLLBACK** → Red (`#EF4444`)
- **DEGRADED** → Amber (`#F59E0B`)

To enable color updates, ensure your ML decision layer has a fill property.

## API Format

Your API endpoint should return JSON at `{baseUrl}/v1/canary/summary`:

```json
{
  "env": "production",
  "canary": {
    "revision": "mf-worker-realtime@2025-12-09-01",
    "traffic": {
      "canary": 0.1,
      "stable": 0.9
    },
    "errorRate": 0.0023,
    "errorCount": 12,
    "latencyP95": 427,
    "healthPassRate": 0.993,
    "mlDecision": {
      "decision": "PROMOTE",
      "confidence": 0.91,
      "anomalies": []
    }
  },
  "stable": {
    "revision": "mf-worker-realtime@2025-12-08-05"
  },
  "lastUpdatedAt": "2025-12-09T18:00:00Z"
}
```

## Usage Workflow

### Daily Design Workflow

1. **Open your Enterprise Canary Dashboard Figma file**
2. **Run the plugin:** `Plugins → Development → Canary Metrics Sync`
3. **Click "Sync Metrics Now"**
4. **Review updated metrics** in your Figma frames
5. **Design with real data** — no more placeholder text!

### Design Review Workflow

1. **Sync latest metrics** before design review
2. **Take screenshots** with real data
3. **Present to stakeholders** with current canary status
4. **Iterate designs** based on actual metrics

## Troubleshooting

### "No layers updated"

**Causes:**
- Layer names don't match convention
- Layers are on a different page
- Layers are locked or in a component

**Solutions:**
1. Check layer names match exactly (case-sensitive)
2. Ensure you're on the correct page
3. Unlock layers or detach from components

### "API error: 404"

**Causes:**
- Incorrect API URL
- Endpoint doesn't exist

**Solutions:**
1. Verify API URL is correct
2. Check endpoint path: `/v1/canary/summary`
3. Test in browser: `curl {your-api-url}/v1/canary/summary`

### "API error: 401"

**Causes:**
- Missing or invalid API key
- Token expired

**Solutions:**
1. Add API key in plugin configuration
2. Verify token has correct permissions
3. Regenerate token if expired

### "API error: Network"

**Causes:**
- No internet connection
- CORS issues
- Firewall blocking requests

**Solutions:**
1. Check internet connection
2. Verify API allows CORS from Figma
3. Check firewall settings

## Security Best Practices

1. **Never commit API keys:**
   - Keep tokens in Figma's `clientStorage` only
   - Use environment variables for local development
   - Rotate tokens regularly

2. **Use read-only tokens:**
   - API keys should have minimal permissions
   - Only allow GET requests to metrics endpoint

3. **Validate API responses:**
   - Plugin validates JSON structure
   - Malformed responses are rejected safely

## Development

### Building

```bash
# One-time build
npm run build

# Watch mode (auto-rebuild on changes)
npm run watch
```

### Reloading Plugin

After making changes:
1. Rebuild: `npm run build`
2. In Figma: `Plugins → Development → Canary Metrics Sync` (reloads automatically)

### File Structure

```
figma-plugins/canary-metrics-sync/
├── manifest.json          # Plugin manifest
├── package.json           # Dependencies
├── tsconfig.json          # TypeScript config
├── src/
│   ├── code.ts           # Plugin logic (Figma API)
│   ├── ui.html           # Plugin UI HTML
│   └── ui.ts             # Plugin UI logic
└── dist/                 # Compiled output
```

## Integration with Dashboard

The plugin works seamlessly with the Enterprise Canary Dashboard:

1. **Dashboard API** (`apps/canary-dashboard/app/api/metrics/route.ts`) serves metrics
2. **Figma Plugin** pulls from the same API
3. **Designers** see real-time data in Figma
4. **Developers** see same data in Next.js dashboard

## Next Steps

- [ ] Add support for multiple workers (realtime, scheduler)
- [ ] Add chart data import (latency trends, error rates)
- [ ] Add historical metrics comparison
- [ ] Add export to CSV/JSON
- [ ] Add scheduled auto-sync

## Support

For issues or questions:
- Check `README.md` in plugin directory
- Review API documentation
- Check Figma plugin console for errors

---

**Status:** ✅ Plugin ready for use  
**Version:** 1.0.0
