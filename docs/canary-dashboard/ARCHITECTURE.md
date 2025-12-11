# Enterprise Canary Dashboard Architecture

## Overview

The Enterprise Canary Dashboard is a real-time observability suite for monitoring canary deployments, powered by Next.js 15, Vercel, Supabase, and WebSockets.

## System Components

### 1. Dashboard Application (`apps/canary-dashboard/`)

**Technology Stack:**
- Next.js 15 with App Router
- React 18
- TypeScript
- Tailwind CSS + shadcn UI
- Chart.js for visualizations

**Key Features:**
- Real-time WebSocket updates
- Grafana-style charts (latency, error rate, ML confidence)
- ML decision visualization
- Live log streaming
- Canary replay mode

### 2. Background Workers

#### Canary Ingestor (`apps/canary-ingestor/`)
- Pulls ML analyzer artifacts from GitHub Actions
- Ingests health check data
- Normalizes and writes to Supabase
- Runs on schedule (CRON) or via webhook

#### Canary Streamer (`apps/canary-streamer/`)
- Fetches logs from Azure Container Apps every 5 seconds
- Streams to WebSocket clients in real-time
- Writes logs to Supabase for persistence
- De-duplicates log entries

### 3. Data Layer (Supabase)

**Tables:**
- `canary_metrics` - Aggregated metrics (latency, error rates)
- `canary_health_checks` - Individual health check results
- `canary_ml_decisions` - ML committee decisions
- `canary_logs` - Container application logs
- `canary_revisions` - Revision and traffic split info

### 4. ML Canary Committee

**Providers:**
- OpenAI GPT-4o
- DeepSeek Chat
- Claude 3.5 Sonnet

**Voting Algorithm:**
- Majority vote on decision (PROMOTE/ROLLBACK/DEGRADED)
- Average confidence score
- Most severe severity
- Combined anomalies list

## Data Flow

```
GitHub Actions Workflows
  ↓
ML Analyzer / Supervisor
  ↓
Artifacts (JSON)
  ↓
Canary Ingestor
  ↓
Supabase Tables
  ↓
Dashboard API
  ↓
WebSocket Broadcast
  ↓
Dashboard UI (Real-time)
```

## WebSocket Topology

```
Dashboard Client
  ↓
WebSocket Connection
  ↓
/api/events (Next.js API Route)
  ↓
WebSocket Server (separate process)
  ↓
Broadcast to all clients
```

**Note:** For production, use a dedicated WebSocket server or service like Pusher/Ably.

## Security Model

### Authentication
- Bearer token authentication
- Token stored in environment variable
- Middleware protects all routes except `/api/`

### Authorization
- Service role key for Supabase (background workers)
- Row Level Security (RLS) enabled
- Policies restrict access to service role only

## Deployment

### Vercel
- Next.js app deployed to Vercel
- Edge functions for API routes
- Environment variables via Vercel dashboard

### Workers
- Ingestor: GitHub Actions or CRON job
- Streamer: Separate Node.js process or Azure Function

## Failover Logic

1. **WebSocket Disconnection:**
   - Client automatically reconnects
   - Falls back to polling if WebSocket unavailable

2. **Supabase Unavailable:**
   - Dashboard shows cached data
   - Workers retry with exponential backoff

3. **ML Provider Failure:**
   - Committee uses available providers
   - Degrades gracefully if all providers fail

## Performance

- **Real-time Updates:** < 1 second latency
- **Chart Rendering:** Optimized with Chart.js
- **Log Streaming:** 5-second intervals
- **Database Queries:** Indexed for < 100ms response

## Monitoring

- Dashboard health endpoint: `/api/health`
- WebSocket connection status indicator
- Error logging to console and Supabase
