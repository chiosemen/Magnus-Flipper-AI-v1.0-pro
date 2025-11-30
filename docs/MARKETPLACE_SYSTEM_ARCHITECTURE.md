# Magnus Flipper AI - Marketplace Monitoring & Alert System Architecture

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Components](#components)
4. [Database Schema](#database-schema)
5. [Data Flow](#data-flow)
6. [API Reference](#api-reference)
7. [Frontend Pages](#frontend-pages)
8. [Alert Engine](#alert-engine)
9. [Notification Delivery](#notification-delivery)
10. [Setup & Deployment](#setup--deployment)
11. [Testing](#testing)
12. [Configuration](#configuration)

---

## System Overview

The Magnus Flipper AI marketplace monitoring system is a comprehensive platform for tracking listings across multiple marketplaces (Vinted, eBay, Gumtree) and delivering intelligent alerts based on user-defined rules.

### Key Features

- **Multi-Marketplace Scraping**: Automated crawling of Vinted, eBay, and Gumtree
- **Intelligent Alert Rules**: Price drops, keyword matches, geo-location, inventory tracking
- **Multi-Channel Notifications**: Email, SMS, Push, and Webhook delivery
- **Queue-Based Processing**: BullMQ/Upstash for job management
- **Scheduled Crawls**: Cron-based periodic scraping (15-minute intervals)
- **Real-Time Analytics**: Profitability heatmaps and anomaly detection

### Technology Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes (serverless)
- **Database**: Supabase (PostgreSQL)
- **Queue**: BullMQ/Upstash Redis
- **Scraping**: Native Fetch API + Cheerio (HTML parsing)
- **Scheduler**: Cron-based job scheduling
- **Monorepo**: Turborepo with pnpm workspaces

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (Next.js)                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │  Dashboard   │  │ Alert Rules  │  │Notifications │  │  Analytics  │ │
│  │   /dashboard │  │/alert-rules  │  │/alert-notif. │  │  /alerts-*  │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────┘ │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 │ API Calls
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        API LAYER (Serverless)                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │/api/listings │  │/api/alert-   │  │/api/alert-   │  │/api/alerts- │ │
│  │              │  │     rules    │  │notifications │  │   anomaly   │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────┘ │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                ┌────────────────┼────────────────┐
                │                │                │
                ▼                ▼                ▼
┌──────────────────────┐  ┌──────────────┐  ┌──────────────────────┐
│   SUPABASE (DB)      │  │  QUEUE       │  │  SCHEDULER           │
│                      │  │  (BullMQ)    │  │  (Cron Jobs)         │
│ ┌──────────────────┐ │  │              │  │                      │
│ │marketplace_      │ │  │┌────────────┐│  │┌────────────────────┐│
│ │  listings        │ │  ││marketplace-││  ││runMarketplaceCrawls││
│ │alert_rules       │ │  ││crawl queue ││  ││  (*/15 * * * *)    ││
│ │alert_notifications│ │  │└────────────┘│  │└────────────────────┘│
│ │alert_delivery_log│ │  │              │  │                      │
│ └──────────────────┘ │  └──────────────┘  └──────────────────────┘
└──────────────────────┘         │                     │
                                 │                     │
                                 ▼                     ▼
                    ┌─────────────────────────────────────────┐
                    │         WORKER PROCESSES                 │
                    │  ┌──────────────┐  ┌──────────────────┐ │
                    │  │worker-crawler│  │worker-analyzer   │ │
                    │  │              │  │                  │ │
                    │  │┌────────────┐│  │┌────────────────┐│ │
                    │  ││Marketplace ││  ││Alert Processor ││ │
                    │  ││Scraping    ││  ││                ││ │
                    │  │└────────────┘│  │└────────────────┘│ │
                    │  │              │  │┌────────────────┐│ │
                    │  │              │  ││Sync to DB      ││ │
                    │  │              │  │└────────────────┘│ │
                    │  └──────────────┘  └──────────────────┘ │
                    └─────────────────────────────────────────┘
                              │                     │
                              │                     │
                              ▼                     ▼
                    ┌─────────────────┐   ┌──────────────────────┐
                    │  SCRAPER        │   │  ALERT ENGINE        │
                    │  PACKAGES       │   │                      │
                    │┌───────────────┐│   │┌────────────────────┐│
                    ││vinted-crawler ││   ││Price Drop Evaluator││
                    ││ebay-crawler   ││   ││Keyword Match       ││
                    ││gumtree-crawler││   ││Geo-Location        ││
                    │└───────────────┘│   ││Inventory Restock   ││
                    │                 │   │└────────────────────┘│
                    └─────────────────┘   └──────────────────────┘
                                                    │
                                                    │
                                                    ▼
                                         ┌──────────────────────┐
                                         │ NOTIFICATION         │
                                         │ DELIVERY             │
                                         │                      │
                                         │┌────────────────────┐│
                                         ││Email Handler       ││
                                         ││SMS Handler         ││
                                         ││Push Handler        ││
                                         ││Webhook Handler     ││
                                         │└────────────────────┘│
                                         └──────────────────────┘
```

---

## Components

### Frontend Components

#### 1. **Alert Rules Page** (`apps/web/src/app/(app)/alert-rules/page.tsx`)
- Create, view, edit, and delete alert rules
- Toggle active/inactive status
- Display trigger counts and last triggered timestamp
- Filter by marketplace and alert type

#### 2. **Alert Notifications Dashboard** (`apps/web/src/app/(app)/alert-notifications/page.tsx`)
- View triggered alert notifications
- Filter by status (Pending, Sent, Failed, Dismissed)
- Dismiss notifications
- Direct links to marketplace listings

#### 3. **Analytics Dashboards**
- **Alerts Anomaly Radar** (`/alerts-anomaly`) - Anomaly detection
- **Crawler Profitability Heatmap** (`/crawler-profitability`) - Value analytics

### Backend Packages

#### 1. **Alert Engine** (`packages/alert-engine/`)
**Purpose**: Evaluate alert rules against scraped listings

**Components**:
- `engine.ts` - Core orchestration and batch evaluation
- `evaluators/price-drop.ts` - Price threshold comparison
- `evaluators/keyword-match.ts` - Text pattern matching
- `evaluators/geo-location.ts` - Location-based filtering
- `evaluators/inventory-restock.ts` - Inventory tracking
- `types.ts` - TypeScript type definitions

**Key Functions**:
```typescript
evaluateAlertRule(rule: AlertRule, listing: ListingToEvaluate): EvaluationResult
evaluateAlertRules(rules: AlertRule[], listing: ListingToEvaluate): EvaluationResult[]
evaluateListingsBatch(rules: AlertRule[], listings: ListingToEvaluate[]): Map<string, EvaluationResult[]>
```

#### 2. **Notification Delivery** (`packages/notification-delivery/`)
**Purpose**: Multi-channel notification delivery

**Components**:
- `delivery.ts` - Orchestrator and routing
- `handlers/email.ts` - Email delivery (SendGrid/SES stub)
- `handlers/sms.ts` - SMS delivery (Twilio stub)
- `handlers/push.ts` - Push notifications (Firebase stub)
- `handlers/webhook.ts` - Webhook delivery (fully implemented)

**Key Functions**:
```typescript
deliverNotification(payload: NotificationPayload): Promise<DeliveryResult>
deliverNotificationMultiChannel(payload: NotificationPayload, channels: NotificationChannel[]): Promise<Map<NotificationChannel, DeliveryResult>>
```

#### 3. **Worker Crawler** (`packages/worker-crawler/`)
**Purpose**: Orchestrate marketplace scraping jobs

**Key Functions**:
```typescript
processMarketplaceCrawlJob(job: { data: MarketplaceCrawlJobData }): Promise<ScrapedListing[]>
crawlMarketplace(marketplace: MarketplaceSite, filter: SearchFilter): Promise<ScrapedListing[]>
```

#### 4. **Worker Analyzer** (`packages/worker-analyzer/`)
**Purpose**: Process scraped data and trigger alerts

**Components**:
- `index.ts` - Main integration function
- `alert-processor.ts` - Alert evaluation and notification creation
- `sync/upsert.ts` - Database sync layer

**Key Functions**:
```typescript
processAndSyncMarketplaceCrawl(job: { data: MarketplaceCrawlJobData }): Promise<{ success: boolean; listingsCount: number; alertsTriggered: number }>
processAlertsForListings(marketplace: string, listings: ScrapedListing[]): Promise<void>
```

#### 5. **Scraper Packages**
- `packages/vinted-crawler/` - Vinted marketplace scraper
- `packages/ebay-crawler/` - eBay marketplace scraper
- `packages/gumtree-crawler/` - Gumtree marketplace scraper

**Each scraper exports**:
```typescript
scrape(query: string): Promise<ScrapeResult>
```

#### 6. **Queue System** (`packages/queue/`)
**Components**:
- `marketplace/marketplace.queue.ts` - Queue definitions
- `marketplace/marketplace.job.ts` - Job data types

**Key Functions**:
```typescript
enqueueMarketplaceCrawl(data: MarketplaceCrawlJobData, options?: EnqueueOptions): Promise<string | null>
```

#### 7. **Scheduler** (`packages/scheduler/`)
**Components**:
- `marketplace-scheduler/schedule.ts` - Cron job registration
- `marketplace-scheduler/tasks.ts` - Task definitions

**Key Functions**:
```typescript
scheduleMarketplaceCrawls(getSavedSearches: () => Promise<SavedSearch[]>): void
runMarketplaceCrawls(savedSearches: SavedSearch[]): Promise<void>
```

---

## Database Schema

### 1. **marketplace_listings**
Stores scraped marketplace listings.

```sql
CREATE TABLE marketplace_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  marketplace TEXT NOT NULL CHECK (marketplace IN ('VINTED', 'EBAY', 'GUMTREE')),
  external_id TEXT NOT NULL,
  title TEXT NOT NULL,
  price NUMERIC,
  url TEXT NOT NULL,
  image_url TEXT,
  location TEXT,
  condition TEXT,
  posted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(marketplace, external_id)
);
```

**Indexes**:
- `idx_marketplace_listings_marketplace_external_id` (unique)

### 2. **alert_rules**
Stores user-defined alert configurations.

```sql
CREATE TABLE alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  alert_type TEXT NOT NULL CHECK (alert_type IN (
    'PRICE_DROP', 'KEYWORD_MATCH', 'INVENTORY_RESTOCK', 'GEO_LOCATION', 'CUSTOM'
  )),
  marketplace TEXT CHECK (marketplace IN ('VINTED', 'EBAY', 'GUMTREE', ...)),
  search_query TEXT,
  conditions JSONB NOT NULL DEFAULT '{}',
  notification_channels JSONB NOT NULL DEFAULT '["EMAIL"]',
  webhook_url TEXT,
  webhook_headers JSONB,
  active BOOLEAN NOT NULL DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  trigger_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Indexes**:
- `idx_alert_rules_user_id`
- `idx_alert_rules_marketplace`
- `idx_alert_rules_alert_type`
- `idx_alert_rules_active`

### 3. **alert_notifications**
Stores triggered alerts with matched listings.

```sql
CREATE TABLE alert_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_rule_id UUID NOT NULL,
  user_id TEXT NOT NULL,
  trigger_type TEXT NOT NULL,
  trigger_reason TEXT,
  listing_id UUID,
  marketplace TEXT,
  listing_title TEXT,
  listing_price NUMERIC,
  listing_url TEXT,
  listing_location TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN (
    'PENDING', 'SENT', 'FAILED', 'DISMISSED'
  )),
  sent_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  failure_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Indexes**:
- `idx_alert_notifications_alert_rule_id`
- `idx_alert_notifications_user_id`
- `idx_alert_notifications_status`
- `idx_alert_notifications_created_at`

### 4. **alert_delivery_log**
Tracks notification delivery attempts across all channels.

```sql
CREATE TABLE alert_delivery_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('EMAIL', 'SMS', 'PUSH', 'WEBHOOK')),
  recipient TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN (
    'QUEUED', 'SENT', 'DELIVERED', 'FAILED', 'BOUNCED'
  )),
  provider TEXT,
  provider_message_id TEXT,
  response_code INTEGER,
  response_body TEXT,
  error_message TEXT,
  queued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Indexes**:
- `idx_alert_delivery_log_notification_id`
- `idx_alert_delivery_log_status`
- `idx_alert_delivery_log_channel`
- `idx_alert_delivery_log_created_at`

---

## Data Flow

### Marketplace Scraping Flow

```
1. Scheduler triggers (every 15 minutes)
   └─> Fetches active saved searches from database
   └─> Enqueues marketplace crawl jobs to queue

2. Queue worker picks up job
   └─> worker-crawler.processMarketplaceCrawlJob()
   └─> Routes to appropriate scraper (Vinted/eBay/Gumtree)
   └─> Scraper fetches HTML and parses listings
   └─> Returns ScrapedListing[] array

3. Worker Analyzer processes results
   └─> worker-analyzer.processAndSyncMarketplaceCrawl()
   └─> Syncs listings to database (upsertListings)
   └─> Triggers alert processor (processAlertsForListings)

4. Alert Processor evaluates rules
   └─> Fetches active alert rules for marketplace
   └─> Evaluates each listing against all rules
   └─> Creates alert_notifications for triggered alerts
   └─> Updates alert rule trigger counts

5. Notification Delivery (async)
   └─> Fetches pending notifications
   └─> Routes to appropriate channel handlers
   └─> Logs delivery attempts
   └─> Updates notification status
```

### Alert Evaluation Flow

```
1. New listing arrives from scraper
   └─> ListingToEvaluate object created

2. Alert rules fetched from database
   └─> Filter by marketplace (if specified)
   └─> Only active rules

3. For each alert rule:
   └─> Route to appropriate evaluator based on alert_type

   PRICE_DROP:
   └─> Compare listing price with threshold
   └─> Check location (optional)
   └─> Return triggered: true/false

   KEYWORD_MATCH:
   └─> Check if listing title contains keywords
   └─> Respect match_type (any/all)
   └─> Return triggered: true/false

   GEO_LOCATION:
   └─> Compare listing location with target
   └─> Check radius (optional)
   └─> Return triggered: true/false

   INVENTORY_RESTOCK:
   └─> Check if item_id matches
   └─> Check notify_on condition
   └─> Return triggered: true/false

4. For triggered alerts:
   └─> Create alert_notification record
   └─> Increment alert_rule.trigger_count
   └─> Update alert_rule.last_triggered_at

5. Notification delivery:
   └─> Fetch notification channels from alert rule
   └─> For each channel, call appropriate handler
   └─> Log delivery attempt
   └─> Update notification status
```

---

## API Reference

### Alert Rules API

#### `GET /api/alert-rules`
List all alert rules for authenticated user.

**Query Parameters**:
- `activeOnly` (boolean) - Filter to active rules only
- `marketplace` (string) - Filter by marketplace

**Response**:
```json
[
  {
    "id": "uuid",
    "user_id": "user123",
    "name": "iPhone 15 Price Drop",
    "description": "Notify when iPhone 15 drops below £500",
    "alert_type": "PRICE_DROP",
    "marketplace": "VINTED",
    "search_query": "iphone 15",
    "conditions": {
      "price_threshold": 500,
      "currency": "GBP",
      "comparison": "less_than",
      "location": "London"
    },
    "notification_channels": ["EMAIL", "PUSH"],
    "active": true,
    "trigger_count": 5,
    "last_triggered_at": "2025-11-30T12:00:00Z",
    "created_at": "2025-11-01T10:00:00Z"
  }
]
```

#### `POST /api/alert-rules`
Create a new alert rule.

**Request Body**:
```json
{
  "name": "Pro Max Keyword Alert",
  "description": "Notify when Pro Max models appear",
  "alert_type": "KEYWORD_MATCH",
  "marketplace": null,
  "search_query": "iphone",
  "conditions": {
    "keywords": ["Pro Max", "15 Pro"],
    "match_type": "any",
    "case_sensitive": false
  },
  "notification_channels": ["EMAIL"],
  "active": true
}
```

**Response**: 201 Created with created alert rule object

#### `PUT /api/alert-rules/:id`
Update an alert rule.

**Request Body**: Partial alert rule object (only include fields to update)

**Response**: Updated alert rule object

#### `DELETE /api/alert-rules/:id`
Delete an alert rule.

**Response**: `{ "success": true }`

### Alert Notifications API

#### `GET /api/alert-notifications`
List triggered alert notifications.

**Query Parameters**:
- `status` (string) - Filter by status (PENDING, SENT, FAILED, DISMISSED)
- `alertRuleId` (string) - Filter by alert rule ID
- `limit` (number) - Max results (default: 100)

**Response**:
```json
[
  {
    "id": "uuid",
    "alert_rule_id": "uuid",
    "user_id": "user123",
    "trigger_type": "PRICE_DROP",
    "trigger_reason": "Price £450 matches condition < £500 in London",
    "listing_title": "iPhone 15 Pro Max 256GB",
    "listing_price": 450,
    "listing_url": "https://vinted.com/...",
    "listing_location": "London, UK",
    "marketplace": "VINTED",
    "status": "SENT",
    "sent_at": "2025-11-30T12:05:00Z",
    "created_at": "2025-11-30T12:00:00Z"
  }
]
```

#### `POST /api/alert-notifications/:id/dismiss`
Mark an alert notification as dismissed.

**Response**: Updated notification object

---

## Frontend Pages

### 1. `/alert-rules`
**Alert Rules Management Page**

**Features**:
- Summary cards (Total Rules, Active Rules, Total Triggers)
- Create new alert rule button
- Alert rules list with:
  - Alert type badge
  - Marketplace badge
  - Active/Inactive status
  - Trigger count and last triggered timestamp
  - Toggle active/inactive button
  - Edit button (placeholder)
  - Delete button with confirmation

**Components Used**:
- Lucide icons: `Plus`, `Bell`, `Trash2`, `Edit`, `Power`, `PowerOff`
- Color-coded badges for alert types and marketplaces

### 2. `/alert-notifications`
**Alert Notifications Dashboard**

**Features**:
- Summary cards (Total, Pending, Sent, Failed)
- Filter tabs (All, Pending, Sent, Failed, Dismissed)
- Notifications list with:
  - Alert icon
  - Listing title
  - Status badge
  - Marketplace badge
  - Trigger reason
  - Price and location details
  - "View Listing" link
  - Dismiss button

**Components Used**:
- Lucide icons: `Bell`, `BellOff`, `ExternalLink`, `X`
- Status-based color coding

---

## Alert Engine

### Alert Types & Conditions

#### 1. **PRICE_DROP**
Trigger when listing price meets threshold.

**Condition Schema**:
```typescript
{
  price_threshold: number;      // e.g., 500
  currency: string;              // e.g., "GBP"
  comparison: "less_than" | "less_than_or_equal" | "greater_than" | "greater_than_or_equal";
  location?: string;             // e.g., "London" (optional)
  radius_km?: number;            // e.g., 10 (optional)
}
```

**Evaluation Logic**:
```typescript
1. Check if listing has price
2. Compare price with threshold using comparison operator
3. If location specified, check if listing location matches
4. Return triggered: true if all conditions met
```

#### 2. **KEYWORD_MATCH**
Trigger when listing title contains specific keywords.

**Condition Schema**:
```typescript
{
  keywords: string[];            // e.g., ["Pro Max", "15 Pro"]
  match_type: "any" | "all";     // "any" = OR, "all" = AND
  case_sensitive?: boolean;      // Default: false
  exact_match?: boolean;         // Use word boundaries (default: false)
}
```

**Evaluation Logic**:
```typescript
1. Normalize listing title based on case_sensitive
2. For each keyword:
   - If exact_match: use word boundary regex
   - Else: use substring match
3. If match_type = "any": trigger if ANY keyword matches
4. If match_type = "all": trigger if ALL keywords match
```

#### 3. **GEO_LOCATION**
Trigger when listing is in specific location.

**Condition Schema**:
```typescript
{
  location: string;              // e.g., "London"
  radius_km: number;             // e.g., 10
  country?: string;              // e.g., "UK" (optional)
}
```

**Evaluation Logic**:
```typescript
1. Check if listing has location
2. Compare listing location with target location (substring match)
3. If country specified, check if location contains country
4. Return triggered: true if location matches
```

**Note**: Current implementation uses simple string matching. For production, integrate geocoding API (Google Maps, Mapbox) for accurate distance calculation.

#### 4. **INVENTORY_RESTOCK**
Trigger when specific item is restocked or price changes.

**Condition Schema**:
```typescript
{
  item_id: string;               // External listing ID to track
  notify_on: "restock" | "new_listing" | "price_change";
  previous_status?: string;      // For tracking state changes
}
```

**Evaluation Logic**:
```typescript
1. Check if listing matches item_id
2. Based on notify_on:
   - "restock": Trigger on new availability
   - "new_listing": Trigger on any new listing
   - "price_change": Trigger on price difference
3. Return triggered: true if condition met
```

**Note**: Requires tracking previous state for accurate restock/price change detection.

---

## Notification Delivery

### Supported Channels

#### 1. **EMAIL** (Stub)
**Integration Required**: SendGrid, AWS SES, Postmark, or similar

**Implementation**:
```typescript
// packages/notification-delivery/src/handlers/email.ts
export async function sendEmailNotification(payload: NotificationPayload): Promise<DeliveryResult>
```

**To Activate**:
1. Install email provider SDK (e.g., `@sendgrid/mail`)
2. Add API key to environment variables
3. Replace stub implementation with actual API calls
4. Update `getProviderName()` in `delivery.ts`

**HTML Template**: Included in `buildAlertEmailHTML()`

#### 2. **SMS** (Stub)
**Integration Required**: Twilio, AWS SNS, Vonage, or similar

**Implementation**:
```typescript
// packages/notification-delivery/src/handlers/sms.ts
export async function sendSMSNotification(payload: NotificationPayload): Promise<DeliveryResult>
```

**To Activate**:
1. Install SMS provider SDK (e.g., `twilio`)
2. Add credentials to environment variables
3. Replace stub implementation with actual API calls
4. Update `getProviderName()` in `delivery.ts`

**Message Optimization**: Automatically truncates to 160 characters

#### 3. **PUSH** (Stub)
**Integration Required**: Firebase Cloud Messaging, OneSignal, or similar

**Implementation**:
```typescript
// packages/notification-delivery/src/handlers/push.ts
export async function sendPushNotification(payload: NotificationPayload): Promise<DeliveryResult>
```

**To Activate**:
1. Install push provider SDK (e.g., `firebase-admin`)
2. Add credentials to environment variables
3. Replace stub implementation with actual API calls
4. Implement device token registration on frontend
5. Update `getProviderName()` in `delivery.ts`

#### 4. **WEBHOOK** (Fully Implemented)
**Status**: ✅ Production Ready

**Implementation**:
```typescript
// packages/notification-delivery/src/handlers/webhook.ts
export async function sendWebhookNotification(payload: NotificationPayload): Promise<DeliveryResult>
```

**Features**:
- HTTP POST with JSON payload
- Custom headers support
- Error handling with response logging
- Full delivery tracking

**Webhook Payload Format**:
```json
{
  "event": "alert.triggered",
  "timestamp": "2025-11-30T12:00:00Z",
  "notification": {
    "id": "uuid",
    "userId": "user123",
    "alertRuleName": "iPhone 15 Price Drop",
    "message": "Price £450 matches condition < £500"
  },
  "listing": {
    "title": "iPhone 15 Pro Max 256GB",
    "price": 450,
    "url": "https://vinted.com/...",
    "location": "London, UK",
    "marketplace": "VINTED"
  }
}
```

### Delivery Logging

All delivery attempts are logged to `alert_delivery_log` table:
- Recipient information
- Delivery status
- Provider response
- Error messages
- Retry counts

---

## Setup & Deployment

### Prerequisites

- Node.js 22+
- pnpm 9+
- Supabase account
- Redis instance (for BullMQ/Upstash)

### Installation

1. **Install Dependencies**
   ```bash
   pnpm install
   ```

2. **Build Packages**
   ```bash
   pnpm build
   ```

3. **Apply Database Migrations**
   ```bash
   # In your Supabase dashboard or CLI:
   # Apply supabase/migrations/20251130_marketplace_listings.sql
   # Apply supabase/migrations/20251130_marketplace_analytics.sql
   # Apply supabase/migrations/20251130_alert_system.sql
   ```

4. **Configure Environment Variables**
   ```bash
   # apps/web/.env.local
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

   # Queue/Redis configuration
   REDIS_URL=redis://your-redis-instance

   # Notification providers (optional)
   SENDGRID_API_KEY=your-sendgrid-key
   TWILIO_ACCOUNT_SID=your-twilio-sid
   TWILIO_AUTH_TOKEN=your-twilio-token
   FIREBASE_SERVICE_ACCOUNT=your-firebase-credentials
   ```

5. **Start Development Server**
   ```bash
   pnpm dev
   ```

### Production Deployment

1. **Deploy Frontend (Vercel)**
   ```bash
   vercel --prod
   ```

2. **Deploy Worker Processes**
   - Deploy `worker-crawler` and `worker-analyzer` to separate processes
   - Use services like Railway, Render, or AWS ECS
   - Ensure Redis access for queue processing

3. **Deploy Scheduler**
   - Deploy `scheduler` as a separate cron service
   - Or use Vercel Cron Jobs / AWS EventBridge

4. **Configure Monitoring**
   - Set up error tracking (Sentry)
   - Configure uptime monitoring
   - Enable database query logging

---

## Testing

### 1. **Scraper Tests**
Test marketplace scrapers individually.

```bash
# Run all scraper tests
cd scripts/scraper-tests
./run-all.sh

# Or run individual tests
npx tsx test-vinted.ts
npx tsx test-ebay.ts
npx tsx test-gumtree.ts
```

**Expected Output**:
- Sample query: "iphone 15"
- Lists first 5 scraped items
- Shows title, price, location, URL
- Pass/fail status

### 2. **Alert Engine Tests**
Test alert rule evaluation.

```bash
npx tsx scripts/alert-tests/test-alert-engine.ts
```

**Test Cases**:
- ✓ Price drop alert (price < threshold)
- ✓ Keyword match alert (contains "Pro Max")
- ✓ Geo-location alert (location = "London")
- ✓ Inactive alert (should not trigger)

**Expected Output**: All tests should pass

### 3. **API Tests**
Test API endpoints using curl or Postman.

```bash
# List alert rules
curl -X GET http://localhost:3000/api/alert-rules \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create alert rule
curl -X POST http://localhost:3000/api/alert-rules \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Alert",
    "alert_type": "PRICE_DROP",
    "conditions": {"price_threshold": 500, "currency": "GBP", "comparison": "less_than"},
    "notification_channels": ["EMAIL"]
  }'

# List notifications
curl -X GET http://localhost:3000/api/alert-notifications \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Configuration

### Alert Rule Configuration Examples

#### Example 1: Price Drop Alert
```json
{
  "name": "iPhone 15 Budget Alert",
  "description": "Notify when iPhone 15 drops below £500 in London",
  "alert_type": "PRICE_DROP",
  "marketplace": "VINTED",
  "search_query": "iphone 15",
  "conditions": {
    "price_threshold": 500,
    "currency": "GBP",
    "comparison": "less_than",
    "location": "London",
    "radius_km": 10
  },
  "notification_channels": ["EMAIL", "PUSH"],
  "active": true
}
```

#### Example 2: Keyword Match Alert
```json
{
  "name": "Pro Max Watcher",
  "description": "Notify when Pro Max models appear",
  "alert_type": "KEYWORD_MATCH",
  "marketplace": null,
  "search_query": "iphone",
  "conditions": {
    "keywords": ["Pro Max", "15 Pro Max"],
    "match_type": "any",
    "case_sensitive": false,
    "exact_match": false
  },
  "notification_channels": ["EMAIL"],
  "active": true
}
```

#### Example 3: Geo-Location Alert
```json
{
  "name": "Local Deals",
  "description": "Notify for items near me",
  "alert_type": "GEO_LOCATION",
  "marketplace": null,
  "search_query": null,
  "conditions": {
    "location": "Manchester",
    "radius_km": 5,
    "country": "UK"
  },
  "notification_channels": ["SMS", "PUSH"],
  "active": true
}
```

#### Example 4: Webhook Alert
```json
{
  "name": "External Integration",
  "description": "Send alerts to external system",
  "alert_type": "PRICE_DROP",
  "marketplace": "EBAY",
  "search_query": "iphone",
  "conditions": {
    "price_threshold": 400,
    "currency": "GBP",
    "comparison": "less_than"
  },
  "notification_channels": ["WEBHOOK"],
  "webhook_url": "https://your-system.com/webhooks/alerts",
  "webhook_headers": {
    "X-API-Key": "your-api-key",
    "X-Custom-Header": "custom-value"
  },
  "active": true
}
```

---

## Performance & Scaling

### Current Limits

- **Scraper Frequency**: 15-minute intervals
- **Alert Rules per User**: Unlimited
- **Notifications per Alert**: Unlimited
- **Batch Size (Listings)**: 50 listings per database write
- **Batch Size (Notifications)**: 100 notifications per database write

### Optimization Recommendations

1. **Database Indexing**: All critical columns indexed
2. **Batch Processing**: Listings and notifications processed in batches
3. **Graceful Degradation**: Log-only error handling, no exceptions thrown
4. **Idempotent Operations**: Scrapers and alert processors can be re-run safely
5. **Queue-Based**: Async job processing prevents API overload

### Scaling Strategies

1. **Horizontal Scaling**: Deploy multiple worker instances
2. **Database Sharding**: Partition by user_id or marketplace
3. **Caching**: Add Redis cache for frequently accessed alert rules
4. **Rate Limiting**: Implement per-user rate limits for API endpoints
5. **CDN**: Use CDN for static assets and images

---

## Security Considerations

### Implemented Security Measures

1. **Authentication**: All API routes use `withAuth()` middleware
2. **User Isolation**: Alert rules and notifications scoped to `user_id`
3. **Input Validation**: Alert type and channel validation
4. **SQL Injection Prevention**: Parameterized queries via Supabase client
5. **HTTPS Only**: Enforce HTTPS in production

### Additional Recommendations

1. **Rate Limiting**: Implement API rate limiting (e.g., 100 req/min per user)
2. **Webhook Validation**: Sign webhook payloads with HMAC
3. **Secret Management**: Use environment variables or secrets manager
4. **Audit Logging**: Log all alert rule changes and deletions
5. **Data Retention**: Implement cleanup policy for old notifications

---

## Troubleshooting

### Common Issues

#### 1. **Scraper Returns Empty Results**
**Cause**: Website HTML structure changed or rate limiting
**Solution**:
- Check scraper selectors in `packages/*/src/parse.ts`
- Add delay between requests
- Rotate user agents

#### 2. **Alert Not Triggering**
**Cause**: Alert rule inactive or condition mismatch
**Solution**:
- Verify `alert_rules.active = true`
- Check condition syntax matches listing data
- Run alert engine test: `npx tsx scripts/alert-tests/test-alert-engine.ts`

#### 3. **Notification Not Sent**
**Cause**: Channel handler stub or provider misconfiguration
**Solution**:
- Check `alert_delivery_log` for error messages
- Verify provider credentials in environment variables
- Test channel handler independently

#### 4. **Queue Jobs Not Processing**
**Cause**: Worker not running or Redis connection issue
**Solution**:
- Verify Redis connection
- Check worker process logs
- Manually enqueue test job

---

## Future Enhancements

### Planned Features

1. **Real-Time Notifications**
   - WebSocket integration for instant frontend updates
   - Push notifications without page refresh

2. **Advanced Analytics**
   - Price trend charts over time
   - Success rate per marketplace
   - Average response time metrics

3. **Machine Learning**
   - Price prediction models
   - Anomaly detection improvements
   - Smart alert suggestions

4. **Additional Marketplaces**
   - Facebook Marketplace
   - Depop
   - Poshmark
   - Mercari

5. **Mobile App**
   - React Native app for iOS/Android
   - Native push notifications
   - Offline support

6. **Collaboration Features**
   - Shared alert rules
   - Team workspaces
   - Alert rule templates

---

## Support & Contributing

### Documentation
- **API Docs**: See [API Reference](#api-reference)
- **Database Schema**: See [Database Schema](#database-schema)
- **Architecture**: This document

### Contact
- **Issues**: GitHub Issues
- **Email**: support@magnusflipperai.com

---

## License

Proprietary - Magnus Flipper AI

---

**Last Updated**: 2025-11-30
**Version**: 1.0.0
**Author**: Claude (Anthropic) with oversight from Magnus Flipper AI team
