# Enterprise Canary Dashboard

A real-time observability suite for monitoring canary deployments with ML-powered decision making.

## Features

- 🔥 **WebSockets-powered live updates** - Real-time data streaming
- 📈 **Grafana-style charts** - Latency, error rate, ML confidence trends
- 🟦 **Standalone Next.js app** - Deployed independently on Vercel
- 🔐 **Protected admin access** - Bearer token authentication
- ⚙️ **Background ingestion** - Automatic data collection from GitHub Actions
- 🌩️ **Real-time log streaming** - Azure Container Apps → Dashboard
- 🛡️ **Failover mode** - Graceful degradation
- 🧠 **ML Canary Committee** - OpenAI + DeepSeek + Claude voting

## Quick Start

### Local Development

```bash
cd apps/canary-dashboard
pnpm install
pnpm dev
```

Visit `http://localhost:3000`

### Production Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full instructions.

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed system design.

## Components

- **Dashboard** (`apps/canary-dashboard/`) - Next.js frontend
- **Ingestor** (`apps/canary-ingestor/`) - Background data ingestion
- **Streamer** (`apps/canary-streamer/`) - Real-time log streaming
- **Supabase** - Data persistence layer

## API Routes

- `GET /api/metrics` - Fetch aggregated metrics
- `GET /api/logs` - Fetch container logs
- `POST /api/ml` - Trigger ML analysis
- `GET /api/events` - WebSocket endpoint
- `GET /api/replay/[runId]` - Replay historical canary run

## Environment Variables

See `.env.example` for required variables.

## Documentation

- [Architecture](./ARCHITECTURE.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Data Flow Diagram](./ARCHITECTURE.md#data-flow)

## License

Private - Magnus Flipper AI
