# Magnus Flipper AI - System Overview

## What is Magnus Flipper AI?

Magnus Flipper AI is an intelligent marketplace arbitrage platform that:

- Scans multiple marketplaces (eBay, Facebook Marketplace, Gumtree, Vinted, Craigslist)
- Identifies profitable arbitrage opportunities using AI-powered deal scoring
- Manages shipping labels and tracking across carriers (USPS, UPS, FedEx)
- Provides subscription-based access with tiered pricing (Free, Pro, Agency, Admin)

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT APPLICATIONS                       │
├─────────────────────────────────────────────────────────────┤
│  Web App (Next.js)          │  Mobile App (Expo/React Native)│
│  - Vercel Deployment        │  - EAS Builds                  │
│  - Server Components         │  - Native Features             │
└──────────────┬──────────────────────┬─────────────────────────┘
               │                      │
               │ HTTPS                │ HTTPS
               │                      │
┌──────────────▼──────────────────────▼─────────────────────────┐
│                    WEB APPLICATION LAYER                      │
├─────────────────────────────────────────────────────────────┤
│  Next.js App Router                                          │
│  - API Routes (/api/*)                                      │
│  - Server Components                                         │
│  - Admin Dashboard                                           │
│  - User Dashboard                                            │
└──────────────┬───────────────────────────────────────────────┘
               │
               │ Wrapper Functions
               │
┌──────────────▼───────────────────────────────────────────────┐
│                    ENGINE PACKAGES                           │
├─────────────────────────────────────────────────────────────┤
│  @magnus-flipper-ai/agentic-engine    │  Core AI logic        │
│  @magnus-flipper-ai/deal-engine       │  Deal scoring         │
│  @magnus-flipper-ai/profit-engine     │  Profit calculations  │
│  @magnus-flipper-ai/shipping-engine   │  Label generation     │
│  @magnus-flipper-ai/scraper-sync      │  Marketplace scraping │
│  @magnus-flipper-ai/arb-engine        │  Arbitrage logic      │
└──────────────┬───────────────────────────────────────────────┘
               │
               │ Database Queries / API Calls
               │
┌──────────────▼───────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                         │
├─────────────────────────────────────────────────────────────┤
│  Supabase (PostgreSQL)        │  Stripe (Payments)           │
│  - User authentication        │  - Subscription management    │
│  - Database storage            │  - Webhook processing        │
│  - Real-time subscriptions     │  - Payment processing        │
└─────────────────────────────────────────────────────────────┘
               │
               │ Background Jobs
               │
┌──────────────▼───────────────────────────────────────────────┐
│                    WORKER PROCESSES                          │
├─────────────────────────────────────────────────────────────┤
│  Worker Services                                              │
│  - Job queue processing                                       │
│  - Marketplace scraping                                       │
│  - Deal scoring                                               │
│  - Heartbeat monitoring                                       │
└─────────────────────────────────────────────────────────────┘
```

## Key Services

### 1. Web Application (Next.js)

**Deployment**: Vercel  
**Repository**: `apps/web/`  
**Technology**: Next.js 16, React 19, TypeScript

**Key Features**:
- Server-side rendering with React Server Components
- API routes for backend functionality
- Admin dashboard for system monitoring
- User dashboard for deal management
- Stripe integration for payments
- Supabase integration for authentication and data

**Environment**: Production on Vercel, preview deployments for PRs

### 2. Mobile Application (Expo)

**Deployment**: EAS Builds  
**Repository**: `apps/mobile/`  
**Technology**: Expo, React Native

**Key Features**:
- Cross-platform iOS/Android app
- Native features (push notifications, biometric auth)
- Offline mode support
- Real-time deal updates

**Environment**: Production builds via EAS

### 3. Engine Packages

**Location**: `packages/*`  
**Type**: Monorepo packages

**Packages**:
- `agentic-engine`: Core AI decision-making logic
- `deal-engine`: Deal scoring and evaluation
- `profit-engine`: Profit margin calculations
- `shipping-engine`: Shipping label generation and tracking
- `scraper-sync`: Marketplace scraping and synchronization
- `arb-engine`: Arbitrage opportunity detection

**Note**: Engine packages are **NOT** modified during operational procedures.

### 4. Worker Services

**Purpose**: Background job processing  
**Database**: Supabase `job_queue` table  
**Monitoring**: `worker_heartbeat` table

**Key Functions**:
- Process marketplace scraping jobs
- Execute deal scoring tasks
- Generate shipping labels
- Update tracking information

**Health Monitoring**: Worker heartbeat checks via `/api/health`

### 5. Supabase (Backend-as-a-Service)

**Purpose**: Database, authentication, real-time features  
**URL**: `https://your-project-id.supabase.co`

**Key Tables**:
- `users`: User accounts and authentication
- `user_subscriptions`: Subscription tier management
- `job_queue`: Background job tracking
- `worker_heartbeat`: Worker health monitoring
- `marketplace_settings`: Marketplace configuration

**Authentication**: Supabase Auth with RLS (Row Level Security)

### 6. Stripe (Payment Processing)

**Purpose**: Subscription management and payments  
**Dashboard**: https://dashboard.stripe.com

**Key Features**:
- Subscription creation and management
- Webhook processing for subscription events
- Payment method management
- Invoice generation

**Webhooks**: Configured to call `/api/stripe/webhook`

## Deployment Topology

### Production Environment

```
┌─────────────────────────────────────────────────────────────┐
│                    PRODUCTION DEPLOYMENT                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Vercel (Web App)                                            │
│  ├─ Production: https://magnusflipper.com                   │
│  ├─ Preview: https://pr-*.magnusflipper.vercel.app         │
│  └─ Environment: Production                                 │
│                                                              │
│  Supabase (Database + Auth)                                  │
│  ├─ URL: https://your-project-id.supabase.co                │
│  ├─ Database: PostgreSQL                                     │
│  └─ Auth: Supabase Auth                                     │
│                                                              │
│  Stripe (Payments)                                           │
│  ├─ Dashboard: https://dashboard.stripe.com                 │
│  ├─ Webhooks: https://magnusflipper.com/api/stripe/webhook  │
│  └─ Mode: Live (production keys)                             │
│                                                              │
│  EAS (Mobile Builds)                                         │
│  ├─ iOS: App Store builds                                   │
│  ├─ Android: Play Store builds                              │
│  └─ Environment: Production                                 │
│                                                              │
│  Workers (Background Jobs)                                  │
│  ├─ Location: Separate worker processes                     │
│  ├─ Database: Supabase job_queue                            │
│  └─ Monitoring: worker_heartbeat table                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Development Environment

- **Local Development**: `http://localhost:3000`
- **Local API**: `http://localhost:4000`
- **Test Stripe Keys**: Test mode keys from Stripe Dashboard
- **Local Supabase**: Can use Supabase local development or test project

## Key URLs and Endpoints

### Production URLs

- **Web App**: `https://magnusflipper.com` (or your Vercel domain)
- **API Health**: `https://magnusflipper.com/api/health`
- **System Telemetry**: `https://magnusflipper.com/api/system/telemetry` (admin only)
- **Stripe Webhook**: `https://magnusflipper.com/api/stripe/webhook`

### Admin Endpoints

- **Admin Dashboard**: `https://magnusflipper.com/admin`
- **Jobs Monitoring**: `https://magnusflipper.com/admin/jobs`
- **Scanner Telemetry**: `https://magnusflipper.com/admin/scanners`
- **Marketplace Settings**: `https://magnusflipper.com/admin/marketplaces`

### API Endpoints

- **Health Check**: `GET /api/health`
- **System Telemetry**: `GET /api/system/telemetry` (requires admin)
- **Admin Jobs**: `GET /api/admin/jobs` (requires admin)
- **Admin Scanners**: `GET /api/admin/scanners/telemetry` (requires admin)
- **Admin Marketplaces**: `GET /api/admin/marketplaces` (requires admin)

## Technology Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 19
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Data Fetching**: TanStack Query

### Backend
- **Runtime**: Node.js (Vercel Serverless Functions)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Payments**: Stripe

### Mobile
- **Framework**: Expo
- **Language**: TypeScript
- **Build System**: EAS Build

### Infrastructure
- **Hosting**: Vercel
- **Database**: Supabase
- **CDN**: Vercel Edge Network
- **Monitoring**: Built-in observability layer

## Data Flow

### User Authentication Flow

1. User visits web app
2. Supabase Auth handles login/signup
3. Session stored in HTTP-only cookies
4. RLS policies enforce data access
5. Subscription tier checked for feature access

### Deal Processing Flow

1. Worker scrapes marketplace listings
2. Deal engine scores opportunities
3. Results stored in Supabase
4. Users see deals in dashboard
5. Users can purchase and generate shipping labels

### Payment Flow

1. User selects subscription tier
2. Stripe Checkout session created
3. User completes payment
4. Stripe webhook notifies app
5. Subscription tier updated in Supabase
6. User gains access to features

## Monitoring and Observability

### Built-in Monitoring

- **Health Endpoint**: `/api/health` - System health status
- **Telemetry Endpoint**: `/api/system/telemetry` - Performance metrics
- **Structured Logging**: JSON logs in production
- **Error Tracking**: Categorized errors with severity levels
- **Performance Metrics**: Latency tracking, error rates
- **SLO Tracking**: Error budgets and availability monitoring

### Key Metrics Tracked

- API latency (P50, P95, P99)
- Error counts by route
- Worker heartbeat status
- Database query performance
- Page load times
- Subscription conversion rates

## Security Features

- **Security Headers**: CSP, HSTS, X-Frame-Options
- **Input Sanitization**: All user input sanitized
- **Rate Limiting**: API route protection
- **SSRF Protection**: Safe fetch utilities
- **Open Redirect Protection**: Domain whitelisting
- **Secret Handling**: Secrets redacted from logs
- **Error Handling**: No sensitive data in error responses

## Support and Documentation

- **Runbook**: This directory (`docs/runbook/`)
- **Environment Variables**: See `.env.example`
- **GitHub Secrets**: See `GITHUB_SECRETS_CHECKLIST.md`
- **EAS Secrets**: See `EAS_SECRETS_MATRIX.md`
- **Vercel Config**: See `.vercel-env.json`

## Quick Reference

| Component | Location | Health Check |
|-----------|----------|--------------|
| Web App | Vercel | `/api/health` |
| Database | Supabase | Health endpoint checks |
| Payments | Stripe | Health endpoint checks |
| Workers | Background | `worker_heartbeat` table |
| Mobile | EAS | App Store / Play Store |

## Next Steps

- Review [Incident Response](./incident-response.md) for handling issues
- Check [Health Checks](./health-checks.md) for monitoring procedures
- See [Deployment Checklist](./deployment-checklist.md) for release procedures

