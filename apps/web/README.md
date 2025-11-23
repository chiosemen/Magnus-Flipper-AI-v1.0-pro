# Magnus Flipper AI - Web Dashboard

Premium fintech-style dashboard for Magnus Flipper AI marketplace arbitrage platform.

## 🎨 Design System

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + Custom Design Tokens
- **Icons**: Lucide React
- **Charts**: Recharts
- **Fonts**: Inter (UI) + JetBrains Mono (Stats)

### Color Palette

- Indigo Blue: `#3C6FF7`
- Dark Navy: `#1A2B4A`
- Cyan Mint: `#5CE0E6`
- Dark Slate: `#0E1117`
- Surface: `#1C2129`

## 🚀 Getting Started

### Development

```bash
# Install dependencies (from monorepo root)
pnpm install

# Run development server
cd apps/web
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
# Build the application
pnpm build

# Start production server
pnpm start
```

## 🐳 Docker Deployment

### Build Image

```bash
# From monorepo root
docker build -f apps/web/Dockerfile -t magnus-web .
```

### Run Container

```bash
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=http://api:4000 \
  magnus-web
```

### Docker Compose

```bash
# Start all services including web
docker-compose up web
```

## 📦 Features

- **Dashboard**: KPI widgets with animated counters and trend indicators
- **Marketplace**: Product grid with filtering and profit analysis
- **Alerts Center**: Real-time notifications for opportunities
- **Crawler Status**: Live monitoring of marketplace crawlers
- **Scheduler**: Job timeline and cron management
- **Queue Monitor**: Redis queue stats and throughput
- **System Health**: Service status and resource monitoring

## 🔌 API Integration

The dashboard automatically connects to the backend API:

- **Development**: `http://localhost:4000`
- **Docker**: `http://api:4000`
- **Fallback**: Mock data when API is unavailable

Configure via `NEXT_PUBLIC_API_URL` environment variable.

## 🎯 Key Components

### UI Components

- `Card`: Glassmorphic containers with neon borders
- `Button`: Multiple variants including neon style
- `Badge`: Status indicators with custom colors
- `Skeleton`: Loading state animations

### Layout Components

- `Sidebar`: Fixed navigation with active state
- `TopBar`: Search and user profile
- `MainLayout`: Wrapper with sidebar + topbar

### Hooks

- `useAPI`: SWR-based data fetching with mock fallback

## 📁 Project Structure

```
apps/web/
├── src/
│   ├── app/              # Next.js 14 App Router pages
│   │   ├── layout.tsx    # Root layout
│   │   ├── page.tsx      # Dashboard
│   │   ├── marketplace/
│   │   ├── alerts/
│   │   ├── crawler/
│   │   ├── scheduler/
│   │   ├── queue/
│   │   └── health/
│   ├── components/
│   │   ├── ui/           # Base UI components
│   │   └── layout/       # Layout components
│   ├── hooks/            # Custom React hooks
│   └── lib/              # Utilities and mock data
├── public/               # Static assets
└── Dockerfile           # Production container
```

## 🔧 Configuration Files

- `next.config.js`: Next.js configuration
- `tailwind.config.ts`: Tailwind + design tokens
- `tsconfig.json`: TypeScript configuration
- `postcss.config.mjs`: PostCSS plugins

## 📊 Performance

- **Output**: Standalone (optimized for Docker)
- **Bundle**: Code splitting enabled
- **Images**: Next.js Image optimization
- **Caching**: SWR for API data

## 🛠️ Development

### Adding a New Page

1. Create `src/app/[route]/page.tsx`
2. Add route to sidebar navigation
3. Create API hook if needed
4. Add mock data for fallback

### Styling Guidelines

- Use Tailwind utility classes
- Apply neon-glow-hover for interactive cards
- Use font-mono for numbers/stats
- Follow the existing color palette

## 📝 License

Part of Magnus Flipper AI monorepo.
