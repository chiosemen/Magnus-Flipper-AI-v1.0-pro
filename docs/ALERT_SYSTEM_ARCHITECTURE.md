# Alert System Architecture

Complete documentation for the alert delivery system for matched listings.

---

## 📊 Data Flow Diagram

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    ALERT SYSTEM FLOW                            │
└─────────────────────────────────────────────────────────────────┘

┌───────────────┐
│ 1. User       │
│ Creates       │
│ Search        │
└───────┬───────┘
        │
        ▼
┌───────────────────────────────────────────────────────────────┐
│ 2. Worker Scheduler (Every 10 minutes)                        │
│    ├─ Runs Facebook Scraping Job                              │
│    └─ Runs Vinted Scraping Job                                │
└───────┬───────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────────┐
│ 3. Scraper fetches marketplace listings                       │
│    ├─ Facebook Scraper                                         │
│    └─ Vinted Scraper                                           │
└───────┬───────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────────┐
│ 4. Matcher checks if listing matches search criteria          │
│    ├─ matchesSearch(listing, search)                          │
│    └─ Returns true/false                                      │
└───────┬───────────────────────────────────────────────────────┘
        │
        ├─ No match ─→ Skip
        │
        ▼ Match!
┌───────────────────────────────────────────────────────────────┐
│ 5. saveDeal()                                                  │
│    ├─ Upsert listing to DB                                     │
│    └─ Call createAlert()                                       │
└───────┬───────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────────┐
│ 6. createAlert() - Alert Service                              │
│    ├─ Check for duplicate (listing + search)                  │
│    ├─ Create alert record in DB                               │
│    └─ Set delivery status: { in_app: pending, email: pending }│
└───────┬───────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────────┐
│ 7. Alert Delivery Worker (Every 5 minutes)                    │
│    ├─ Get pending alerts from DB                              │
│    └─ Process each channel                                    │
└───────┬───────────────────────────────────────────────────────┘
        │
        ├──────────────────┬────────────────────┐
        ▼                  ▼                    ▼
   ┌─────────┐      ┌──────────────┐   ┌────────────────┐
   │ In-App  │      │ Email        │   │ Future:        │
   │ Alert   │      │ Delivery     │   │ SMS / Push     │
   └────┬────┘      └──────┬───────┘   └────────────────┘
        │                  │
        │                  ▼
        │           ┌──────────────┐
        │           │ Email        │
        │           │ Provider     │
        │           │ (SendGrid,   │
        │           │  SES, etc.)  │
        │           └──────┬───────┘
        │                  │
        └──────────────────┴───────────────────┐
                                                │
                                                ▼
                                    ┌─────────────────────┐
                                    │ Update delivery     │
                                    │ status: sent/failed │
                                    └───────┬─────────────┘
                                            │
                                            ▼
                            ┌───────────────────────────────┐
                            │ 8. User views alerts          │
                            │    ├─ Notification bell       │
                            │    ├─ /dashboard/alerts       │
                            │    └─ Email inbox             │
                            └───────────────────────────────┘
```

---

## 🏗️ System Architecture

### Components

```
┌────────────────────────────────────────────────────────────┐
│                  ALERT SYSTEM COMPONENTS                    │
└────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│   Database Layer     │
├──────────────────────┤
│ • alerts table       │
│ • saved_searches     │
│ • listings           │
│ • users              │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│   Core Services      │
├──────────────────────┤
│ • alert-service.ts   │
│ • email-service.ts   │
│ • alert-delivery-    │
│   worker.ts          │
└──────────┬───────────┘
           │
           ├─────────────────┬─────────────────┐
           ▼                 ▼                 ▼
    ┌───────────┐    ┌─────────────┐   ┌─────────────┐
    │ Workers   │    │ API Routes  │   │ UI          │
    │           │    │             │   │ Components  │
    ├───────────┤    ├─────────────┤   ├─────────────┤
    │ • worker- │    │ • GET       │   │ • Notif     │
    │   scheduler    │   /api/     │   │   Bell      │
    │ • Facebook│    │   alerts    │   │ • Alerts    │
    │   matcher │    │ • PATCH     │   │   Page      │
    │ • Vinted  │    │   /api/     │   │             │
    │   matcher │    │   alerts/   │   │             │
    │           │    │   :id       │   │             │
    └───────────┘    └─────────────┘   └─────────────┘
```

---

## 🗄️ Database Schema

### Alert Model

```typescript
model Alert {
  id             String   @id @default(uuid())
  userId         String
  savedSearchId  String?
  listingId      String
  title          String
  price          Float
  marketplace    String
  url            String
  alertType      String   // "listing_match"
  isRead         Boolean  @default(false)
  isSent         Boolean  @default(false)
  metadata       Json?    // Contains delivery status
  createdAt      DateTime @default(now())
  
  // Relations
  user          User
  savedSearch   SavedSearch?
}
```

### Metadata Structure

```typescript
{
  imageUrl: string;
  description: string;
  channels: ["in_app", "email"];
  deliveryStatus: {
    in_app: {
      status: "pending" | "sent" | "failed";
      sentAt?: string;
      failedAt?: string;
      error?: string;
    };
    email: {
      status: "pending" | "sent" | "failed";
      sentAt?: string;
      failedAt?: string;
      error?: string;
    };
  };
}
```

---

## 🔄 Alert Lifecycle

### State Transitions

```
┌─────────────┐
│   Created   │ isRead: false, isSent: false
└──────┬──────┘
       │
       ├─ Alert Delivery Worker processes alert
       │
       ▼
┌─────────────┐
│  Delivered  │ isRead: false, isSent: true
└──────┬──────┘
       │
       ├─ User views alert in UI
       │
       ▼
┌─────────────┐
│    Read     │ isRead: true, isSent: true
└──────┬──────┘
       │
       ├─ After 30 days (cleanup)
       │
       ▼
┌─────────────┐
│   Deleted   │
└─────────────┘
```

---

## 📝 Code Flow (Detailed)

### 1. Alert Creation (Worker)

```typescript
// apps/worker-scheduler/src/facebook-job.ts

for (const search of searches) {
  const listings = await scrapeFacebookListings(keywords, filters);
  
  for (const listing of listings) {
    if (matchesSearch(listing, search)) {
      // Save listing
      await saveDeal(listing, search.id, search.userId);
      
      // ✅ Alert created inside saveDeal()
    }
  }
}
```

```typescript
// apps/worker-scheduler/src/facebook-matcher.ts

export async function saveDeal(listing, searchId, userId) {
  // 1. Upsert listing
  const savedListing = await prisma.listing.upsert({...});
  
  // 2. Create alert
  const alertResult = await createAlert({
    userId,
    savedSearchId: searchId,
    listingId: savedListing.id,
    listing: {
      title: listing.title,
      price: listing.price,
      marketplace: "facebook",
      url: listing.url,
      imageUrl: listing.imageUrl,
      description: listing.description,
    },
  });
  
  // ✅ Alert created!
}
```

### 2. Alert Service

```typescript
// packages/core/src/alerts/alert-service.ts

export async function createAlert(input) {
  // Check for duplicate
  const existing = await prisma.alert.findFirst({
    where: {
      userId: input.userId,
      savedSearchId: input.savedSearchId,
      listingId: input.listingId,
    },
  });
  
  if (existing) {
    return { created: false, alertId: existing.id };
  }
  
  // Create new alert
  const alert = await prisma.alert.create({
    data: {
      userId: input.userId,
      savedSearchId: input.savedSearchId,
      listingId: input.listingId,
      title: input.listing.title,
      price: input.listing.price,
      marketplace: input.listing.marketplace,
      url: input.listing.url,
      alertType: "listing_match",
      isRead: false,
      isSent: false,
      metadata: {
        imageUrl: input.listing.imageUrl,
        description: input.listing.description,
        channels: ["in_app", "email"],
        deliveryStatus: {
          in_app: { status: "pending" },
          email: { status: "pending" },
        },
      },
    },
  });
  
  return { created: true, alertId: alert.id };
}
```

### 3. Alert Delivery Worker

```typescript
// packages/core/src/alerts/alert-delivery-worker.ts

export async function runAlertDeliveryCycle() {
  // Process in-app alerts
  const inAppResult = await processAlertDelivery("in_app");
  
  // Process email alerts
  const emailResult = await processAlertDelivery("email");
  
  return { inApp: inAppResult, email: emailResult };
}

async function processAlertDelivery(channel) {
  const alerts = await getPendingAlertsForDelivery(channel);
  
  for (const alert of alerts) {
    if (channel === "in_app") {
      // Mark as sent (in-app alerts are immediately available)
      await updateAlertDeliveryStatus(alert.id, channel, "sent");
    } else if (channel === "email") {
      // Send email
      const result = await sendAlertEmail({...});
      
      if (result.success) {
        await updateAlertDeliveryStatus(alert.id, channel, "sent");
      } else {
        await updateAlertDeliveryStatus(alert.id, channel, "failed", result.error);
      }
    }
  }
}
```

### 4. API Endpoints

```typescript
// apps/web/app/api/alerts/route.ts

// GET /api/alerts
export async function GET(request) {
  const user = await getUser();
  const result = await getUserAlerts(user.id, {
    limit: 50,
    offset: 0,
    unreadOnly: false,
  });
  
  return NextResponse.json({
    alerts: result.alerts,
    pagination: {
      total: result.total,
      unread: result.unread,
      hasMore: ...,
    },
  });
}

// POST /api/alerts (mark all as read)
export async function POST(request) {
  const user = await getUser();
  const count = await markAllAlertsAsRead(user.id);
  return NextResponse.json({ success: true, count });
}
```

```typescript
// apps/web/app/api/alerts/[id]/route.ts

// PATCH /api/alerts/:id
export async function PATCH(request, { params }) {
  const user = await getUser();
  const { id } = await params;
  const { isRead } = await request.json();
  
  if (isRead) {
    await markAlertAsRead(id, user.id);
  }
  
  return NextResponse.json({ success: true });
}
```

### 5. UI Components

```typescript
// apps/web/components/NotificationBell.tsx

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Poll every 30 seconds
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);
  
  async function fetchUnreadCount() {
    const response = await fetch("/api/alerts?unreadOnly=true&limit=1");
    const data = await response.json();
    setUnreadCount(data.pagination.unread);
  }
  
  // Show bell with badge
  return (
    <button>
      <Bell />
      {unreadCount > 0 && <span>{unreadCount}</span>}
    </button>
  );
}
```

---

## ⚙️ Configuration

### Worker Schedule

| Task | Interval | Component |
|------|----------|-----------|
| **Facebook Scraping** | 10 minutes | worker-scheduler |
| **Vinted Scraping** | 10 minutes | worker-scheduler |
| **Alert Delivery** | 5 minutes | worker-scheduler |

### Polling Intervals

| Component | Interval | Purpose |
|-----------|----------|---------|
| **Notification Bell** | 30 seconds | Update unread count |
| **Alerts Page** | On load | Fetch all alerts |

---

## 🔐 De-duplication Strategy

### One Alert Per Listing Per Search

```typescript
// Check before creating
const existing = await prisma.alert.findFirst({
  where: {
    userId,
    savedSearchId,
    listingId,
  },
});

if (existing) {
  return { created: false };
}
```

**Why this works:**
- Same listing won't create duplicate alerts for the same search
- Different searches can create separate alerts for the same listing
- User gets one notification per matched listing per search

---

## 📧 Email Integration

### Provider Stub

The email service is ready for integration with any provider:

```typescript
// packages/core/src/alerts/email-service.ts

export async function sendAlertEmail(alert) {
  // **PROVIDER STUB**
  // Uncomment your chosen provider:
  
  // SendGrid
  // await sgMail.send({...});
  
  // AWS SES
  // await ses.sendEmail({...}).promise();
  
  // Resend
  // await resend.emails.send({...});
  
  // Postmark
  // await client.sendEmail({...});
}
```

**To enable email delivery:**
1. Choose an email provider
2. Add API key to environment variables
3. Uncomment the appropriate integration code
4. Test with a single alert

---

## 🚀 Future Extensibility

### Adding New Channels

The system is designed to support additional channels:

```typescript
// Example: SMS alerts
export type AlertChannel = "in_app" | "email" | "sms";

// Add to delivery worker
if (channel === "sms") {
  const result = await sendSMSAlert({...});
  await updateAlertDeliveryStatus(alert.id, "sms", result.status);
}
```

### Adding Push Notifications

```typescript
export type AlertChannel = "in_app" | "email" | "push";

// Implement push notification delivery
if (channel === "push") {
  const result = await sendPushNotification({...});
  await updateAlertDeliveryStatus(alert.id, "push", result.status);
}
```

---

## ✅ Success Criteria

**Alerts are working correctly if:**

1. ✅ New matched listings create alerts
2. ✅ No duplicate alerts for same listing + search
3. ✅ Notification bell shows unread count
4. ✅ /dashboard/alerts page displays alerts
5. ✅ Marking as read updates UI
6. ✅ Email service is ready for provider integration

---

## 📊 Monitoring

### Key Metrics

```typescript
// Log from alert delivery worker
console.log(`
  Alert Delivery Complete:
  - In-app: ${inApp.succeeded}/${inApp.processed}
  - Email: ${email.succeeded}/${email.processed}
`);
```

### Health Checks

```bash
# Check pending alerts
SELECT COUNT(*) FROM alerts WHERE is_sent = false;

# Check recent alerts
SELECT COUNT(*) FROM alerts WHERE created_at > NOW() - INTERVAL '1 hour';

# Check delivery failures
SELECT * FROM alerts 
WHERE metadata->>'deliveryStatus'->>'email'->>'status' = 'failed'
LIMIT 10;
```

---

**Last Updated:** 2025-12-13  
**Status:** ✅ Complete and ready for production
