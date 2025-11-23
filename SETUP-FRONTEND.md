# Magnus Flipper AI - Frontend Dashboard Setup Guide

This guide provides complete instructions for running the Magnus Flipper AI admin dashboard locally and in Docker.

## Overview

The Magnus Flipper AI admin dashboard is a Next.js 14 application that provides a premium UI for monitoring and managing the marketplace automation platform.

### Features

- **Dashboard**: Real-time overview with key metrics
- **Marketplace Scanner**: Browse and analyze marketplace deals
- **Alerts Center**: Monitor system alerts and opportunities
- **Crawler Status**: Track marketplace crawler health
- **Scheduler Status**: View scheduled job execution
- **Redis Queue Monitor**: Real-time queue metrics and job tracking

### Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui Components
- Lucide Icons

## Quick Start

### Prerequisites

- Node.js 20 or higher
- pnpm 9.15.4 or higher
- Docker & Docker Compose (for containerized deployment)

### Local Development

1. **Install Dependencies**

```bash
# From project root
pnpm install
```

2. **Configure Environment**

```bash
# Copy environment template
cp apps/web/.env.example apps/web/.env.local

# Edit .env.local to set API URL
echo "NEXT_PUBLIC_API_URL=http://localhost:4000" > apps/web/.env.local
```

3. **Start Development Server**

```bash
# Option 1: Using workspace script
pnpm dev:web

# Option 2: Using filter
pnpm --filter web dev

# Option 3: From web directory
cd apps/web && pnpm dev
```

4. **Access Dashboard**

Open your browser to: http://localhost:3000

### Production Build (Local)

```bash
# Build the application
pnpm --filter web build

# Start production server
pnpm --filter web start
```

## Docker Deployment

### Using Docker Compose

1. **Build and Start All Services**

```bash
# Build and start all services (including web dashboard)
docker compose up --build

# Or run in detached mode
docker compose up -d --build
```

2. **Access Dashboard**

The dashboard will be available at: http://localhost:3000

The API will be available at: http://localhost:4000

3. **View Logs**

```bash
# View all service logs
docker compose logs -f

# View only web dashboard logs
docker compose logs -f web

# View API logs
docker compose logs -f api
```

4. **Stop Services**

```bash
# Stop all services
docker compose down

# Stop and remove volumes
docker compose down -v
```

### Docker Configuration Details

The web service configuration in `docker-compose.yml`:

```yaml
web:
  build:
    context: .
    dockerfile: apps/web/Dockerfile
    args:
      NEXT_PUBLIC_API_URL: http://api:4000
  ports:
    - "3000:3000"
  environment:
    NEXT_PUBLIC_API_URL: http://api:4000
    NODE_ENV: production
  depends_on:
    - api
  restart: unless-stopped
```

## Environment Variables

### Development (.env.local)

```bash
# Local API (when running backend locally)
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### Docker (.env or docker-compose.yml)

```bash
# Docker API (when running in containers)
NEXT_PUBLIC_API_URL=http://api:4000
```

## Project Structure

```
apps/web/
├── src/
│   ├── app/                     # Next.js pages (App Router)
│   │   ├── (dashboard)/         # Dashboard layout group
│   │   │   ├── dashboard/       # Main dashboard
│   │   │   ├── scanner/         # Marketplace scanner
│   │   │   ├── alerts/          # Alerts center
│   │   │   ├── crawler/         # Crawler status
│   │   │   ├── scheduler/       # Scheduler status
│   │   │   └── queue/           # Queue monitor
│   │   ├── layout.tsx           # Root layout
│   │   ├── page.tsx             # Home (redirects)
│   │   └── globals.css          # Global styles
│   ├── components/
│   │   ├── ui/                  # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── badge.tsx
│   │   │   └── table.tsx
│   │   └── navbar.tsx           # Navigation
│   └── lib/
│       ├── api.ts               # API client
│       └── utils.ts             # Utilities
├── public/                      # Static assets
├── Dockerfile                   # Docker config
├── next.config.js               # Next.js config
├── tailwind.config.ts           # Tailwind config
├── tsconfig.json                # TypeScript config
└── package.json                 # Dependencies
```

## API Integration

The dashboard connects to the backend API and automatically falls back to mock data if the API is unavailable.

### API Endpoints

- `GET /health` - Health check
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/deals` - Marketplace deals
- `GET /api/alerts` - System alerts
- `GET /api/crawler/status` - Crawler status
- `GET /api/scheduler/jobs` - Scheduled jobs
- `GET /api/queue/metrics` - Queue metrics

### Mock Data Fallback

When the backend is unavailable, the dashboard shows:
- A "Using Mock Data" badge
- Realistic sample data for all features
- Full UI functionality for testing

This allows you to:
- Develop the frontend independently
- Test the UI without running the backend
- Demo the application without infrastructure

## Development Workflow

### Adding New Pages

1. Create a new directory under `src/app/(dashboard)/`
2. Add a `page.tsx` file with your component
3. Add navigation link in `src/components/navbar.tsx`

### Adding New Components

```bash
# Create new shadcn/ui component
# (Components are already included)

# Or create custom component
mkdir -p src/components/custom
touch src/components/custom/MyComponent.tsx
```

### Styling

The project uses Tailwind CSS with shadcn/ui design system:

- Use utility classes: `className="flex items-center gap-2"`
- Use component variants: `<Button variant="destructive">`
- Use shadcn components: `Card`, `Badge`, `Table`, etc.

## Troubleshooting

### Port 3000 Already in Use

```bash
# Find and kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 pnpm dev
```

### API Connection Failed

1. Check backend is running: `curl http://localhost:4000/health`
2. Verify environment variable: `echo $NEXT_PUBLIC_API_URL`
3. Check Docker network (if using Docker)
4. The app will automatically use mock data as fallback

### Build Errors

```bash
# Clear Next.js cache
rm -rf apps/web/.next

# Clear node modules and reinstall
rm -rf apps/web/node_modules
pnpm install

# Rebuild
pnpm --filter web build
```

### Docker Build Issues

```bash
# Rebuild without cache
docker compose build --no-cache web

# Check build logs
docker compose logs web

# Restart container
docker compose restart web
```

## Performance Optimization

### Production Optimizations

- Static page generation for fast loads
- Automatic code splitting
- Image optimization
- CSS minification
- Gzip compression

### Resource Limits (Docker)

```yaml
deploy:
  resources:
    limits:
      cpus: '0.5'
      memory: 512M
```

## Scripts Reference

### From Project Root

```bash
# Development
pnpm dev:web                 # Start dev server
pnpm --filter web dev        # Alternative

# Production
pnpm build                   # Build all apps
pnpm --filter web build      # Build only web
pnpm start:web               # Start production server

# Utilities
pnpm --filter web lint       # Run linter
```

### From apps/web Directory

```bash
pnpm dev                     # Start dev server
pnpm build                   # Build for production
pnpm start                   # Start production server
pnpm lint                    # Run linter
```

## Next Steps

1. **Customize the Dashboard**: Modify pages to match your needs
2. **Connect Real API**: Update endpoints when backend is ready
3. **Add Authentication**: Implement user login and permissions
4. **Deploy to Production**: Use Vercel, AWS, or your hosting provider

## Support

For issues or questions:
- Check the logs: `docker compose logs -f web`
- Review the README: `apps/web/README.md`
- Check Next.js docs: https://nextjs.org/docs

## License

MIT
