# Magnus Flipper API (Serverless)

Next.js-based serverless API for Magnus Flipper AI marketplace scraping and deal-finding platform.

## Features

- **Serverless Architecture**: Optimized for Vercel deployment
- **Multi-Marketplace Scraping**: Facebook Marketplace, Craigslist, OfferUp, eBay
- **Cron Jobs**: Automated scraping on schedule
- **Supabase Integration**: PostgreSQL database with connection pooling
- **RESTful API**: Clean API routes with authentication
- **TypeScript**: Full type safety

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Runtime**: Node.js serverless functions
- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth JWT
- **Scraping**: Axios + Cheerio (serverless-compatible)
- **Validation**: Zod
- **Type Safety**: TypeScript

## API Routes

### Core Endpoints

- `GET /api/health` - Health check
- `GET /api/saved-searches` - List saved searches
- `POST /api/saved-searches` - Create saved search
- `GET /api/saved-searches/:id` - Get specific search
- `PATCH /api/saved-searches/:id` - Update search
- `DELETE /api/saved-searches/:id` - Delete search
- `GET /api/listings` - Browse listings with filters
- `GET /api/listings/:id` - Get specific listing
- `GET /api/listings/feed` - Get matched listings for a saved search
- `GET /api/alerts` - List user alerts
- `PATCH /api/alerts/:id` - Update alert
- `DELETE /api/alerts/:id` - Delete alert

### Cron Endpoints (Protected)

- `POST /api/cron/facebook` - Crawl Facebook Marketplace
- `POST /api/cron/craigslist` - Crawl Craigslist
- `POST /api/cron/offerup` - Crawl OfferUp
- `POST /api/cron/ebay` - Crawl eBay

## Environment Variables

Create a `.env` file based on `.env.example`:

```bash
# Required
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:password@host:5432/postgres
CRON_SECRET=your-random-secret

# Optional
EBAY_APP_ID=your-ebay-app-id
```

## Development

```bash
# Install dependencies (from monorepo root)
pnpm install

# Run in development mode
pnpm --filter @magnus-flipper-ai/api-serverless dev

# Build for production
pnpm --filter @magnus-flipper-ai/api-serverless build

# Type check
pnpm --filter @magnus-flipper-ai/api-serverless type-check
```

## Deployment to Vercel

### 1. Install Vercel CLI

```bash
pnpm add -g vercel
```

### 2. Link to Vercel Project

```bash
cd apps/api-serverless
vercel link
```

### 3. Set Environment Variables

```bash
vercel env add SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add DATABASE_URL
vercel env add CRON_SECRET
vercel env add EBAY_APP_ID
```

### 4. Deploy

```bash
# Preview deployment
vercel

# Production deployment
vercel --prod
```

## Cron Schedule

Configured in `vercel.json`:

- **Facebook**: Every 2 hours at :00
- **Craigslist**: Every 2 hours at :15
- **OfferUp**: Every 2 hours at :30
- **eBay**: Every 2 hours at :45

## Database Schema

The API uses the following Supabase tables:

- `users` - User accounts
- `saved_searches` - User-defined search criteria
- `listings` - Scraped marketplace listings
- `listing_matches` - Listings that match saved searches
- `alerts` - User notifications

## Marketplace Crawlers

### Craigslist ✅
- **Status**: Fully functional
- **Method**: HTTP scraping with Cheerio
- **Rate Limits**: Respect Craigslist's robots.txt
- **Coverage**: All US cities

### eBay ✅
- **Status**: Fully functional
- **Method**: Official eBay Finding API
- **Requirements**: eBay App ID (get at developer.ebay.com)
- **Coverage**: Local pickup listings only

### OfferUp ⚠️
- **Status**: Limited (client-side rendering)
- **Method**: HTTP scraping + structured data
- **Recommendation**: Use headless browser or API for production

### Facebook Marketplace ⚠️
- **Status**: Requires authentication
- **Method**: Placeholder implementation
- **Recommendation**: Use Facebook Graph API or headless browser service

## Security

- JWT authentication via Supabase Auth
- Cron endpoints protected with CRON_SECRET
- CORS headers configured
- SQL injection prevention via Supabase client
- XSS protection headers

## Performance

- Serverless functions with 30s default timeout
- Cron jobs with 5min (300s) timeout
- Connection pooling for database
- Singleton pattern for Supabase client

## License

Proprietary - Magnus Flipper AI
