# Magnus Flipper AI - Admin Dashboard

Premium admin dashboard UI for the Magnus Flipper AI marketplace automation platform.

## Features

- **Dashboard**: Overview metrics with key performance indicators
- **Marketplace Scanner**: Browse and analyze deals from various marketplaces
- **Alerts Center**: Monitor system alerts and high-profit opportunities
- **Crawler Status**: Real-time monitoring of marketplace crawlers
- **Scheduler Status**: View and manage scheduled jobs
- **Redis Queue Monitor**: Track job queues and worker performance

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui
- **Icons**: Lucide React
- **Type Safety**: TypeScript

## Environment Configuration

The dashboard automatically switches between Docker and local development environments.

### Local Development

```bash
# Set API URL to localhost
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### Docker Environment

```bash
# Set API URL to Docker service name
NEXT_PUBLIC_API_URL=http://api:4000
```

## Running Locally

### Prerequisites

- Node.js 20+
- pnpm 9.15.4+

### Installation

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev
```

The dashboard will be available at http://localhost:3000

### Development Commands

```bash
# Start dev server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run linter
pnpm lint
```

## Running in Docker

### Build and Run

```bash
# Build and start all services (including web dashboard)
docker compose up --build

# Start in detached mode
docker compose up -d

# View logs
docker compose logs -f web

# Stop all services
docker compose down
```

The dashboard will be available at http://localhost:3000

### Docker Configuration

The web service is configured in `docker-compose.yml`:
- Port: 3000
- API URL: http://api:4000
- Healthcheck: Automatic
- Resource limits: 512MB RAM, 0.5 CPU

## Mock Data Fallback

The dashboard uses mock data when the backend API is unavailable:
- Automatic fallback on API errors
- Visual indicator when using mock data
- Allows development without backend

## Project Structure

```
apps/web/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (dashboard)/        # Dashboard layout group
│   │   │   ├── dashboard/      # Main dashboard page
│   │   │   ├── scanner/        # Marketplace scanner
│   │   │   ├── alerts/         # Alerts center
│   │   │   ├── crawler/        # Crawler status
│   │   │   ├── scheduler/      # Scheduler status
│   │   │   └── queue/          # Queue monitor
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Home page (redirects to dashboard)
│   │   └── globals.css         # Global styles
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── badge.tsx
│   │   │   └── table.tsx
│   │   └── navbar.tsx          # Navigation bar
│   └── lib/
│       ├── api.ts              # API client with mock fallback
│       └── utils.ts            # Utility functions
├── public/                     # Static assets
├── Dockerfile                  # Docker configuration
├── next.config.js              # Next.js configuration
├── tailwind.config.ts          # Tailwind configuration
├── tsconfig.json               # TypeScript configuration
└── package.json                # Dependencies
```

## API Integration

The dashboard connects to the backend API at `NEXT_PUBLIC_API_URL`. All API calls automatically fall back to mock data if the backend is unavailable.

### Available Endpoints

- `GET /health` - Health check
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/deals` - Marketplace deals
- `GET /api/alerts` - System alerts
- `GET /api/crawler/status` - Crawler status
- `GET /api/scheduler/jobs` - Scheduled jobs
- `GET /api/queue/metrics` - Queue metrics

## Building for Production

```bash
# Build the application
pnpm build

# The output will be in .next/standalone/
# Docker uses this for production deployment
```

## Troubleshooting

### Port Already in Use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### API Connection Issues

1. Check API is running on port 4000
2. Verify `NEXT_PUBLIC_API_URL` environment variable
3. Check network connectivity (Docker network for containers)

### Build Errors

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules
pnpm install

# Rebuild
pnpm build
```

## License

MIT
