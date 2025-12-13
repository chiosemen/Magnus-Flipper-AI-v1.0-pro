# Alert System - Quick Reference

> Complete alert delivery system for matched listings

---

## 🎯 Quick Overview

**What:** Alert users when listings match their saved searches  
**Channels:** In-app notifications + Email  
**Delivery:** Every 5 minutes via worker  
**De-duplication:** One alert per listing per search  

---

## 📁 Files Reference

### Core Services (3 files)

| File | Purpose | Lines |
|------|---------|-------|
| `packages/core/src/alerts/alert-service.ts` | Alert CRUD operations | 270 |
| `packages/core/src/alerts/email-service.ts` | Email sending with HTML template | 230 |
| `packages/core/src/alerts/alert-delivery-worker.ts` | Process pending alerts | 130 |

### API Routes (2 files)

| Endpoint | File | Method |
|----------|------|--------|
| `/api/alerts` | `apps/web/app/api/alerts/route.ts` | GET, POST |
| `/api/alerts/:id` | `apps/web/app/api/alerts/[id]/route.ts` | PATCH |

### Workers (3 files modified)

| File | What Changed |
|------|--------------|
| `apps/worker-scheduler/src/index.ts` | Added alert delivery job (every 5 min) |
| `apps/worker-scheduler/src/facebook-matcher.ts` | Call `createAlert()` on match |
| `apps/worker-scheduler/src/vinted-matcher.ts` | Call `createAlert()` on match |

### UI Components (2 files + 1 modified)

| Component | File | Purpose |
|-----------|------|---------|
| Notification Bell | `apps/web/components/NotificationBell.tsx` | Header bell with dropdown |
| Alerts Page | `apps/web/app/dashboard/alerts/page.tsx` | Full alerts inbox |
| Header | `apps/web/marketing-swoopa/components/Header.tsx` | Added bell to header |

---

## 🔄 Data Flow (One-Minute Version)

```
1. Worker scrapes marketplace (every 10 min)
   ↓
2. Matcher finds listing that matches search
   ↓
3. saveDeal() → createAlert()
   ↓
4. Alert saved to DB (isRead: false, isSent: false)
   ↓
5. Alert delivery worker runs (every 5 min)
   ↓
6. Process in-app: Mark as sent
   Process email: Send via provider → Mark as sent/failed
   ↓
7. User sees alert:
   - Notification bell (polls every 30s)
   - /dashboard/alerts page
   - Email inbox
```

---

## 📊 Key Functions

### Create Alert

```typescript
import { createAlert } from "@magnus-flipper-ai/core/alerts/alert-service";

const result = await createAlert({
  userId: "user-123",
  savedSearchId: "search-456",
  listingId: "listing-789",
  listing: {
    title: "iPhone 12 Pro",
    price: 499,
    marketplace: "facebook",
    url: "https://...",
    imageUrl: "https://...",
    description: "Like new...",
  },
});

// Returns: { created: true, alertId: "alert-123" }
// Or: { created: false, alertId: "existing-id" } (duplicate)
```

### Get User Alerts

```typescript
import { getUserAlerts } from "@magnus-flipper-ai/core/alerts/alert-service";

const result = await getUserAlerts("user-123", {
  limit: 50,
  offset: 0,
  unreadOnly: false,
});

// Returns: { alerts: [...], total: 23, unread: 5 }
```

### Mark As Read

```typescript
import { markAlertAsRead } from "@magnus-flipper-ai/core/alerts/alert-service";

await markAlertAsRead("alert-123", "user-123");
```

### Send Email

```typescript
import { sendAlertEmail } from "@magnus-flipper-ai/core/alerts/email-service";

const result = await sendAlertEmail({
  id: "alert-123",
  to: "user@example.com",
  subject: "New match: iPhone 12 Pro",
  listing: { title, price, marketplace, url, imageUrl },
  search: { name: "iPhone Search" },
});

// Returns: { success: true, messageId: "msg-123" }
// Or: { success: false, error: "..." }
```

### Run Delivery

```typescript
import { runAlertDeliveryCycle } from "@magnus-flipper-ai/core/alerts/alert-delivery-worker";

const result = await runAlertDeliveryCycle();

// Returns: {
//   inApp: { processed: 5, succeeded: 5, failed: 0 },
//   email: { processed: 3, succeeded: 2, failed: 1 },
// }
```

---

## 🌐 API Endpoints

### GET /api/alerts

```bash
curl "https://flipperagents.com/api/alerts?limit=10&unreadOnly=true" \
  -H "Cookie: sb-access-token=$TOKEN"
```

**Response:**
```json
{
  "alerts": [...],
  "pagination": {
    "total": 23,
    "unread": 5,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}
```

### PATCH /api/alerts/:id

```bash
curl -X PATCH "https://flipperagents.com/api/alerts/alert-123" \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=$TOKEN" \
  -d '{"isRead": true}'
```

### POST /api/alerts (mark all read)

```bash
curl -X POST "https://flipperagents.com/api/alerts" \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=$TOKEN" \
  -d '{"action": "mark_all_read"}'
```

---

## 🗄️ Database

### Alert Schema

```sql
CREATE TABLE alerts (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  saved_search_id UUID,
  listing_id VARCHAR NOT NULL,
  title VARCHAR NOT NULL,
  price FLOAT NOT NULL,
  marketplace VARCHAR NOT NULL,
  url VARCHAR NOT NULL,
  alert_type VARCHAR NOT NULL,
  is_read BOOLEAN DEFAULT false,
  is_sent BOOLEAN DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Metadata Example

```json
{
  "imageUrl": "https://...",
  "description": "Item description",
  "channels": ["in_app", "email"],
  "deliveryStatus": {
    "in_app": { "status": "sent", "sentAt": "2025-12-13T12:00:00Z" },
    "email": { "status": "pending" }
  }
}
```

---

## ⚙️ Configuration

### Worker Schedule

```typescript
// worker-scheduler/src/index.ts

// Facebook scraping: Every 10 minutes
const FACEBOOK_JOB_INTERVAL = 10 * 60 * 1000;

// Vinted scraping: Every 10 minutes
const VINTED_JOB_INTERVAL = 10 * 60 * 1000;

// Alert delivery: Every 5 minutes
const ALERT_DELIVERY_INTERVAL = 5 * 60 * 1000;
```

### UI Polling

```typescript
// Notification bell polls every 30 seconds
const POLL_INTERVAL = 30000;

useEffect(() => {
  fetchUnreadCount();
  const interval = setInterval(fetchUnreadCount, POLL_INTERVAL);
  return () => clearInterval(interval);
}, []);
```

---

## 📧 Email Setup

### Choose Provider

```typescript
// email-service.ts

// Option 1: SendGrid (recommended)
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
await sgMail.send({...});

// Option 2: AWS SES
const AWS = require('aws-sdk');
const ses = new AWS.SES({ region: 'us-east-1' });
await ses.sendEmail({...}).promise();

// Option 3: Resend
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);
await resend.emails.send({...});

// Option 4: Postmark
const postmark = require('postmark');
const client = new postmark.ServerClient(process.env.POSTMARK_API_TOKEN);
await client.sendEmail({...});
```

### Steps to Enable

1. Choose provider (SendGrid recommended)
2. Add API key to `.env`:
   ```
   SENDGRID_API_KEY=your-key-here
   ```
3. Uncomment provider code in `email-service.ts`
4. Test with single alert

---

## 🐛 Debugging

### Check Pending Alerts

```sql
SELECT COUNT(*) FROM alerts WHERE is_sent = false;
```

### Check Recent Alerts

```sql
SELECT * FROM alerts 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

### Check Delivery Failures

```sql
SELECT * FROM alerts 
WHERE metadata->'deliveryStatus'->'email'->>'status' = 'failed'
LIMIT 10;
```

### Check Worker Logs

```bash
az containerapp logs show \
  --name mf-worker-scheduler \
  --resource-group magnus-rg \
  --tail 50 | grep "Alert"
```

**Expected:**
```
[Alert Delivery] Processing 5 in_app alerts
[Alert] Created alert alert-123 for user user-456
[Alert Delivery] ✅ In-app alert alert-123 marked as available
```

---

## ✅ Testing Checklist

### Manual Test

- [ ] Create a search
- [ ] Wait for worker to scrape (10 min)
- [ ] Check notification bell shows badge
- [ ] Click bell → See recent alerts
- [ ] Visit /dashboard/alerts → See full list
- [ ] Click "Mark as read" → Badge updates
- [ ] Click alert → Opens listing
- [ ] Check email inbox (if provider configured)

### API Test

```bash
# 1. Get alerts
curl https://flipperagents.com/api/alerts \
  -H "Cookie: sb-access-token=$TOKEN" | jq '.pagination.unread'

# 2. Should return unread count
# Output: 5

# 3. Mark as read
curl -X PATCH https://flipperagents.com/api/alerts/alert-123 \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=$TOKEN" \
  -d '{"isRead": true}'

# 4. Check again
curl https://flipperagents.com/api/alerts \
  -H "Cookie: sb-access-token=$TOKEN" | jq '.pagination.unread'

# Output: 4
```

---

## 🚀 Future Extensions

### Add SMS

```typescript
// 1. Add to AlertChannel type
export type AlertChannel = "in_app" | "email" | "sms";

// 2. Implement in delivery worker
if (channel === "sms") {
  const result = await sendSMSAlert({...});
  await updateAlertDeliveryStatus(alert.id, "sms", result.status);
}
```

### Add Push Notifications

```typescript
// 1. Add to AlertChannel type
export type AlertChannel = "in_app" | "email" | "push";

// 2. Implement push delivery
if (channel === "push") {
  const result = await sendPushNotification({...});
  await updateAlertDeliveryStatus(alert.id, "push", result.status);
}
```

---

## 📚 Full Documentation

- **Architecture:** `docs/ALERT_SYSTEM_ARCHITECTURE.md`
- **Summary:** `ALERT_SYSTEM_IMPLEMENTATION_SUMMARY.md`
- **Quick Ref:** `docs/ALERT_SYSTEM_QUICK_REFERENCE.md` (this file)

---

**Last Updated:** 2025-12-13  
**Status:** ✅ Production Ready
