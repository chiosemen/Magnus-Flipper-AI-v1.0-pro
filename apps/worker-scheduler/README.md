# Worker Scheduler

Scheduled marketplace scraping worker that runs periodic scans.

## Overview

This worker runs scheduled scans of enabled marketplaces at regular intervals. It fetches marketplace settings from the database and executes scraping tasks based on the configured schedule.

## Features

- Scheduled marketplace scans
- Configurable scan interval
- Health check endpoint on port 3000
- Heartbeat monitoring
- Rate limiting and concurrency control

## Environment Variables

Required:
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_ANON_KEY` - Supabase API key

Optional:
- `WORKER_ID` - Unique worker identifier (default: `worker-scheduler-001`)
- `WORKER_HEARTBEAT_INTERVAL` - Heartbeat interval in ms (default: 60000)
- `SCAN_INTERVAL` - Scan interval in ms (default: 600000 = 10 minutes)
- `PORT` - Health check server port (default: 3000)

## Development

```bash
# Install dependencies
pnpm install

# Run in development mode
pnpm dev

# Build
pnpm build

# Run unit tests (build output)
pnpm test

# Run production build
pnpm start
```

## Docker Build

Build from repository root:

```bash
docker build -f apps/worker-scheduler/Dockerfile -t magnus-worker-scheduler:latest .
```

## Deployment

Deploy to Azure Container Apps using the Terraform configuration in `infra/azure/`.
