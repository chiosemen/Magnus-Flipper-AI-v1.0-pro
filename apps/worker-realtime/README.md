# Worker Realtime

Real-time job processing worker for marketplace scraping tasks.

## Overview

This worker processes jobs from the `job_queue` table in real-time. It continuously polls for pending jobs and executes marketplace scraping tasks as they arrive.

## Features

- Real-time job processing from database queue
- Marketplace scraping with rate limiting
- Health check endpoint on port 3000
- Heartbeat monitoring
- Automatic error handling and retry logic

## Environment Variables

Required:
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_ANON_KEY` - Supabase API key

Optional:
- `WORKER_ID` - Unique worker identifier (default: `worker-realtime-001`)
- `WORKER_HEARTBEAT_INTERVAL` - Heartbeat interval in ms (default: 60000)
- `PORT` - Health check server port (default: 3000)

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
docker build -f apps/worker-realtime/Dockerfile -t magnus-worker-realtime:latest .
```

## Deployment

Deploy to Azure Container Apps using the Terraform configuration in `infra/azure/`.
