# Magnus Flipper AI - Quick Start Guide

Get the marketplace monitoring and alert system up and running in under 10 minutes.

---

## 🚀 Quick Setup (Development)

### Step 1: Install Dependencies
```bash
pnpm install
```

### Step 2: Configure Environment
Create `apps/web/.env.local`:
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Redis (for queue)
REDIS_URL=redis://localhost:6379

# Optional: Notification Providers
# SENDGRID_API_KEY=your-key
# TWILIO_ACCOUNT_SID=your-sid
# TWILIO_AUTH_TOKEN=your-token
```

### Step 3: Apply Database Migrations
In your Supabase SQL Editor, run these migrations in order:
1. `supabase/migrations/20251130_marketplace_listings.sql`
2. `supabase/migrations/20251130_marketplace_analytics.sql`
3. `supabase/migrations/20251130_alert_system.sql`

### Step 4: Build & Start
```bash
# Build all packages
pnpm build

# Start development server
pnpm dev
```

Visit http://localhost:3000 🎉

---

## 🧪 Testing

### Test Scrapers
```bash
cd scripts/scraper-tests
npx tsx test-vinted.ts
npx tsx test-ebay.ts
npx tsx test-gumtree.ts
```

### Test Alert Engine
```bash
npx tsx scripts/alert-tests/test-alert-engine.ts
```

---

## 📱 Using the System

### 1. Create Your First Alert Rule

Navigate to http://localhost:3000/alert-rules

**Example: Price Drop Alert**
```json
{
  "name": "iPhone 15 Budget Alert",
  "alert_type": "PRICE_DROP",
  "marketplace": "VINTED",
  "search_query": "iphone 15",
  "conditions": {
    "price_threshold": 500,
    "currency": "GBP",
    "comparison": "less_than",
    "location": "London"
  },
  "notification_channels": ["EMAIL"]
}
```

### 2. View Notifications

Navigate to http://localhost:3000/alert-notifications

Filter by status:
- **Pending** - Waiting to be sent
- **Sent** - Successfully delivered
- **Failed** - Delivery error
- **Dismissed** - Manually dismissed

### 3. Check Analytics

- **Alerts Radar**: http://localhost:3000/alerts-anomaly
- **Profit Heatmap**: http://localhost:3000/crawler-profitability

---

## 🔧 Common Tasks

### Manually Trigger a Scrape
```bash
# Run Vinted scraper
npx tsx scripts/scraper-tests/test-vinted.ts
```

### Check Queue Status
```bash
# If using BullMQ, check Redis
redis-cli
> KEYS marketplace-crawl*
```

### View Database Records
```sql
-- Check scraped listings
SELECT * FROM marketplace_listings ORDER BY created_at DESC LIMIT 10;

-- Check alert rules
SELECT * FROM alert_rules WHERE active = true;

-- Check triggered notifications
SELECT * FROM alert_notifications ORDER BY created_at DESC LIMIT 10;

-- Check delivery logs
SELECT * FROM alert_delivery_log ORDER BY created_at DESC LIMIT 10;
```

---

## 📊 System Architecture

```
Frontend (Next.js) → API Routes → Supabase Database
                              ↓
                         Queue (Redis)
                              ↓
                    Worker Processes
                    ├─ Scraper (Vinted/eBay/Gumtree)
                    ├─ Alert Processor
                    └─ Notification Delivery
```

---

## 🔐 Authentication

The system uses Supabase Auth. Make sure users are authenticated before accessing protected routes.

All API routes use the `withAuth()` middleware:
```typescript
return withAuth(request, async ({ user }) => {
  // Your code here
});
```

---

## 📝 Alert Types Reference

| Type | When It Triggers | Example Use Case |
|------|------------------|------------------|
| **PRICE_DROP** | Price meets threshold | "Alert me when iPhone 15 < £500" |
| **KEYWORD_MATCH** | Title contains keywords | "Alert me for 'Pro Max' models" |
| **GEO_LOCATION** | Item in specific location | "Alert me for items in London" |
| **INVENTORY_RESTOCK** | Item restocked or price changes | "Alert me when item #123 restocks" |

---

## 🚨 Troubleshooting

### "Cannot find module 'cheerio'"
**Solution**: Run `pnpm install` in the project root

### "Supabase connection error"
**Solution**: Check your `.env.local` file has correct Supabase credentials

### "Alert not triggering"
**Solution**:
1. Check alert rule is `active = true`
2. Verify condition syntax matches listing data
3. Run test: `npx tsx scripts/alert-tests/test-alert-engine.ts`

### "Webhook not receiving notifications"
**Solution**:
1. Check `alert_delivery_log` for error messages
2. Verify webhook URL is accessible
3. Test webhook endpoint manually with curl

---

## 📚 Next Steps

- 📖 Read the full [System Architecture Documentation](./MARKETPLACE_SYSTEM_ARCHITECTURE.md)
- 🔗 Set up notification providers (SendGrid, Twilio, Firebase)
- 🎯 Configure cron scheduler for automated scraping
- 🚀 Deploy to production (Vercel + worker processes)

---

## 🆘 Need Help?

- **Full Documentation**: [MARKETPLACE_SYSTEM_ARCHITECTURE.md](./MARKETPLACE_SYSTEM_ARCHITECTURE.md)
- **API Reference**: See architecture docs → API Reference section
- **GitHub Issues**: Report bugs and feature requests

---

**Happy scraping! 🎉**
