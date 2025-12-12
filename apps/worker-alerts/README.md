# Worker Alerts

Operational alerts monitoring worker for marketplace scraping anomalies.

## Overview

This worker continuously monitors `scrape_runs` for anomalies, uses ML intelligence (OpenAI/DeepSeek) to classify severity and category, and generates operational alerts stored in the `operational_alerts` table.

## Features

- Real-time anomaly detection from scrape runs
- ML-driven classification (OpenAI/DeepSeek) with heuristic fallback
- Severity classification (INFO/WARNING/CRITICAL)
- Category classification (RATE_LIMIT/BLOCK/NETWORK/OTHER)
- Health check endpoint on port 3000
- Metrics endpoint with anomaly counts and error ratios
- Alert deduplication to prevent spam
- Database persistence of alerts

## Environment Variables

Required:
- `DATABASE_URL` - PostgreSQL connection string
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

Optional:
- `WORKER_ID` - Unique worker identifier (default: `worker-alerts-001`)
- `PORT` - Health check server port (default: 3000)
- `ALERTS_POLL_INTERVAL_MS` - Poll interval in ms (default: 30000 = 30s)
- `MIN_ALERT_DELAY_MS` - Minimum delay between identical alerts (default: 600000 = 10min)
- `ML_ALERTS_PROVIDER` - ML provider: "openai", "deepseek", or "none" (default: "none")
- `OPENAI_API_KEY` - OpenAI API key (required if using OpenAI)
- `DEEPSEEK_API_KEY` - DeepSeek API key (required if using DeepSeek)
- `OPENAI_BASE_URL` - OpenAI API base URL (default: https://api.openai.com/v1)
- `DEEPSEEK_BASE_URL` - DeepSeek API base URL (default: https://api.deepseek.com/v1)

## Development

```bash
# Install dependencies
pnpm install

# Run in development mode
pnpm dev

# Build
pnpm build

# Run production build
pnpm start
```

## Docker Build

Build from repository root:

```bash
docker build -f Dockerfile.worker-alerts -t magnus-worker-alerts:latest .
```

## Deployment

Deploy to Azure Container Apps using the Terraform configuration in `infra/azure/`.

The worker is included in the One-Button Deploy pipeline and will be automatically built, pushed to ACR, and deployed.

## Health Endpoints

- `GET /health` - Returns worker status and recent check info
- `GET /metrics` - Returns anomaly counts, error ratios, and metrics

## ML Classification

The worker supports three classification modes:

1. **OpenAI** (recommended): Uses `gpt-4o-mini` for accurate classification
2. **DeepSeek** (cost-effective): Uses `deepseek-chat` for classification
3. **Heuristics** (fallback): Rule-based classification when ML unavailable

ML classification provides:
- Severity assessment (INFO/WARNING/CRITICAL)
- Category classification (RATE_LIMIT/BLOCK/NETWORK/OTHER)
- Confidence score (0.0-1.0)
- Actionable recommendations

## Alert Persistence

Alerts are stored in the `operational_alerts` table with:
- Marketplace identifier
- Severity and category
- ML provider used (or null for heuristics)
- Confidence score
- Raw context (error codes, messages, counts)
- Recommendations array

## Monitoring

Monitor the worker via:
- Health endpoint: `https://<fqdn>/health`
- Metrics endpoint: `https://<fqdn>/metrics`
- Azure Container App logs
- `operational_alerts` database table
