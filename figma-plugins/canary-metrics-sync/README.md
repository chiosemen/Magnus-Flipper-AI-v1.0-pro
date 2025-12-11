# Canary Metrics Sync - Figma Plugin

A Figma plugin that automatically syncs live canary deployment metrics from your API into Figma frames and components.

## Features

- 🔄 Sync canary metrics from HTTP API
- 🎨 Auto-update text layers and status colors
- 🔐 Secure API key storage
- ⚡ One-click sync
- 🧪 API connection testing
- 🌍 Multi-environment support (production, staging, local)

## Installation (Development)

1. **Build the plugin:**
   ```bash
   cd figma-plugins/canary-metrics-sync
   npm install
   npm run build
   ```

2. **Load in Figma:**
   - Open Figma Desktop app
   - Go to `Plugins → Development → Import plugin from manifest...`
   - Select `figma-plugins/canary-metrics-sync/manifest.json`
   - The plugin will appear in `Plugins → Development → Canary Metrics Sync`

## Configuration

1. **Run the plugin** in Figma
2. **Enter your API URL:**
   - Production: `https://api.example.com` or `https://your-dashboard.vercel.app`
   - Local: `http://localhost:3000`
3. **Optional:** Add API key/token for authentication
4. **Select Environment:** Production, Staging, or Local
5. **Click "Save Configuration"**

## Layer Naming Convention

The plugin looks for specific layer names in your Figma file. Name your text layers as follows:

- `metric-canary-traffic` - Traffic split (e.g., "90% stable / 10% canary")
- `metric-error-rate` - Error rate (e.g., "0.23% (12 errors)")
- `metric-latency-p95` - P95 latency (e.g., "427 ms")
- `metric-ml-decision` - ML decision (e.g., "PROMOTE (91%)")
- `metric-health-score` - Health pass rate (e.g., "99.3% passing /health")
- `metric-canary-revision` - Canary revision name
- `metric-stable-revision` - Stable revision name
- `metric-last-updated` - Last update timestamp

## API Endpoint

The plugin uses the canonical endpoint:

**GET** `/api/canary/summary?env={env}&worker={worker}`

See `docs/canary-dashboard/API_SPEC.md` for full API documentation.

### Example Response

```json
{
  "env": "production",
  "worker": "mf-worker-realtime",
  "canary": {
    "revision": "mf-worker-realtime@2025-12-09-01",
    "traffic": {
      "canary": 0.1,
      "stable": 0.9
    },
    "errorRate": 0.0023,
    "latencyP95": 427,
    "healthPassRate": 0.993,
    "mlDecision": {
      "decision": "PROMOTE",
      "confidence": 0.91,
      "severity": "OK",
      "anomalies": []
    }
  },
  "stable": {
    "revision": "mf-worker-realtime@2025-12-08-05"
  },
  "traffic": {
    "totalRequestsLast15m": 5231,
    "errorCountLast15m": 12
  },
  "timestamps": {
    "lastAnalysisAt": "2025-12-09T18:00:00.000Z",
    "lastDeploymentAt": "2025-12-09T17:45:31.000Z"
  }
}
```

## Usage

1. **Open your Enterprise Canary Dashboard Figma file**
2. **Run the plugin:** `Plugins → Development → Canary Metrics Sync`
3. **Click "Sync Metrics Now"**
4. The plugin will:
   - Fetch latest metrics from your API
   - Update all matching text layers
   - Apply status colors to ML decision badges
   - Show a success message with update count

## Status Colors

The plugin automatically applies colors to ML decision badges:

- **PROMOTE** → Green (`#22C55E`)
- **ROLLBACK** → Red (`#EF4444`)
- **DEGRADED** → Amber (`#F59E0B`)

## Security

- API keys are stored locally in Figma's `clientStorage`
- Never commit real API keys to git
- Use environment variables or Figma secrets for production

## Troubleshooting

**"No layers updated"**
- Check that your text layers are named correctly (see Layer Naming Convention)
- Ensure layers are on the current page
- Verify layers are not locked or inside components

**"API error: 404"**
- Verify your API URL is correct
- Check that the endpoint `/api/canary/summary` exists
- Ensure you're using the full base URL (e.g., `https://api.example.com` or `http://localhost:3000`)

**"API error: 401"**
- Add your API key in the plugin configuration
- Verify the token has correct permissions

**"API error: Network"**
- Check internet connection
- Verify API allows CORS from Figma
- Check firewall settings

## Development

```bash
# Watch mode (auto-rebuild on changes)
npm run watch

# Build once
npm run build
```

After building, reload the plugin in Figma to see changes.

## Integration

This plugin works seamlessly with:

- **Enterprise Canary Dashboard** (`apps/canary-dashboard/`)
- **Canary Summary API** (`/api/canary/summary`)
- **Supabase** (data source)

All components read from the same canonical API endpoint, ensuring consistency across dashboard and design tools.

## License

Private - Magnus Flipper AI
