# Tier System - Implementation Guide

Complete documentation for the paywall and tier-based limits system.

---

## 📊 Tier Comparison Table

| Feature | Free | Pro |
|---------|------|-----|
| **Price** | $0/month | $29/month |
| **Max Saved Searches** | 3 | 50 |
| **Max Active Alerts** | 10 | 1,000 |
| **Facebook Marketplace** | ✅ | ✅ |
| **Vinted Marketplace** | ✅ | ✅ |
| **In-App Alerts** | ✅ | ✅ |
| **Email Alerts** | ❌ | ✅ |
| **API Access** | ❌ | 🔮 Future |
| **Priority Support** | ❌ | 🔮 Future |

---

## 🔒 Enforcement Points

### 1. Search Creation API

**File:** `apps/web/app/api/searches/route.ts`

**Checks:**
- ✅ Max saved searches limit
- ✅ Marketplace access

**Code Location:**
```typescript
// Line ~40-55
const searchCheck = await canCreateSearch(user.id);
if (!searchCheck.allowed) {
  const errorResponse = formatLimitError("MAX_SEARCHES_REACHED", tier);
  return NextResponse.json(errorResponse, { status: 403 });
}

const marketplaceCheck = await canAccessMarketplace(user.id, marketplace);
if (!marketplaceCheck.allowed) {
  const errorResponse = formatLimitError("MARKETPLACE_NOT_ALLOWED", tier);
  return NextResponse.json(errorResponse, { status: 403 });
}
```

**Error Response Example:**
```json
{
  "error": "You've reached the maximum number of saved searches for your plan.",
  "errorCode": "MAX_SEARCHES_REACHED",
  "upgrade": "Upgrade to Pro to create up to 50 searches.",
  "currentPlan": "Free",
  "currentLimits": {
    "maxSavedSearches": 3,
    "maxActiveAlerts": 10
  },
  "proPlan": {
    "displayName": "Pro",
    "price": 29,
    "maxSavedSearches": 50,
    "maxActiveAlerts": 1000
  }
}
```

---

### 2. Alert Creation Service

**File:** `packages/core/src/alerts/alert-service.ts`

**Checks:**
- ✅ Max active alerts limit

**Code Location:**
```typescript
// Line ~45-50
const alertCheck = await canReceiveAlert(userId);
if (!alertCheck.allowed) {
  console.log(`[Alert] User ${userId} has reached alert limit`);
  return { created: false, reason: "MAX_ALERTS_REACHED" };
}
```

**Behavior:**
- When limit reached, new alerts are **silently skipped**
- Existing listings continue to be saved
- Worker logs indicate alert was skipped due to limit

---

### 3. Alert Delivery Worker

**File:** `packages/core/src/alerts/alert-delivery-worker.ts`

**Checks:**
- ✅ Email alerts permission (Pro only)

**Code Location:**
```typescript
// Line ~60-70
const emailCheck = await canReceiveEmailAlerts(alert.userId);

if (!emailCheck.allowed) {
  await updateAlertDeliveryStatus(
    alert.id,
    "email",
    "failed",
    "Email alerts not available on current plan"
  );
  console.log(`[Alert Delivery] ⏭️  Skipping email (not available on user's plan)`);
}
```

**Behavior:**
- Free tier users: Email alerts are **skipped**, in-app alerts still work
- Pro tier users: Both email and in-app alerts are delivered

---

## 🏗️ Architecture

### Core Files

| File | Purpose | Lines |
|------|---------|-------|
| `packages/core/src/tiers/tier-config.ts` | Tier definitions and limits | 160 |
| `packages/core/src/tiers/tier-service.ts` | Tier checks and enforcement | 220 |
| `apps/web/app/api/searches/route.ts` | Search creation enforcement | Modified |
| `apps/web/app/api/usage/route.ts` | Usage stats API | 40 |
| `packages/core/src/alerts/alert-service.ts` | Alert creation enforcement | Modified |
| `packages/core/src/alerts/alert-delivery-worker.ts` | Email delivery enforcement | Modified |

---

## 📐 Tier Configuration

### Tier Config Structure

```typescript
// packages/core/src/tiers/tier-config.ts

export const TIER_CONFIG = {
  free: {
    name: "free",
    displayName: "Free",
    price: 0,
    features: {
      maxSavedSearches: 3,
      maxActiveAlerts: 10,
      marketplaces: ["facebook", "vinted"],
      emailAlerts: false,
      inAppAlerts: true,
    },
  },
  pro: {
    name: "pro",
    displayName: "Pro",
    price: 29,
    features: {
      maxSavedSearches: 50,
      maxActiveAlerts: 1000,
      marketplaces: ["facebook", "vinted"],
      emailAlerts: true,
      inAppAlerts: true,
      apiAccess: false, // Future
      prioritySupport: true, // Future
    },
  },
};
```

---

## 🔑 Tier Detection Logic

### Priority Order

1. **Subscription Status** (from `subscriptions` table)
   - If `status = "active"` or `"trialing"` and `plan = "pro"` → Pro tier
2. **User Role** (manual assignment)
   - If `role = "pro"` or `"admin"` → Pro tier
3. **Default**
   - All other cases → Free tier

### Code

```typescript
// packages/core/src/tiers/tier-config.ts

export function getUserTier(user: {
  subscription?: { plan: string; status: string } | null;
  role?: string;
}): TierName {
  // Check subscription first
  if (user.subscription) {
    const { plan, status } = user.subscription;
    if (status === "active" || status === "trialing") {
      if (plan === "pro" || plan === "premium") {
        return "pro";
      }
    }
  }

  // Fallback to role
  if (user.role && (user.role === "pro" || user.role === "admin")) {
    return "pro";
  }

  // Default to free
  return "free";
}
```

---

## 🚀 Usage API

### GET /api/usage

**Get current usage and limits for authenticated user**

```bash
curl https://flipperagents.com/api/usage \
  -H "Cookie: sb-access-token=$TOKEN"
```

**Response:**
```json
{
  "tier": "free",
  "limits": {
    "maxSavedSearches": 3,
    "maxActiveAlerts": 10,
    "emailAlerts": false,
    "inAppAlerts": true,
    "marketplaces": ["facebook", "vinted"]
  },
  "usage": {
    "savedSearches": {
      "current": 2,
      "limit": 3,
      "percentage": 67
    },
    "activeAlerts": {
      "current": 5,
      "limit": 10,
      "percentage": 50
    }
  },
  "upgradeAvailable": true
}
```

---

## 📝 Error Messages

### MAX_SEARCHES_REACHED

```json
{
  "error": "You've reached the maximum number of saved searches for your plan.",
  "errorCode": "MAX_SEARCHES_REACHED",
  "upgrade": "Upgrade to Pro to create up to 50 searches.",
  "currentPlan": "Free",
  "currentLimits": {
    "maxSavedSearches": 3,
    "maxActiveAlerts": 10
  },
  "proPlan": {
    "displayName": "Pro",
    "price": 29,
    "maxSavedSearches": 50,
    "maxActiveAlerts": 1000
  }
}
```

### MAX_ALERTS_REACHED

```json
{
  "error": "You've reached the maximum number of active alerts for your plan.",
  "errorCode": "MAX_ALERTS_REACHED",
  "upgrade": "Upgrade to Pro to receive up to 1,000 alerts."
}
```

### EMAIL_ALERTS_NOT_ALLOWED

```json
{
  "error": "Email alerts are only available on the Pro plan.",
  "errorCode": "EMAIL_ALERTS_NOT_ALLOWED",
  "upgrade": "Upgrade to Pro to receive email notifications."
}
```

---

## 🔧 How to Upgrade (Without Refactor)

### Option 1: Manual Upgrade (No Stripe)

**Direct database update:**

```sql
-- Update subscription status
UPDATE subscriptions
SET 
  plan = 'pro',
  status = 'active',
  current_period_start = NOW(),
  current_period_end = NOW() + INTERVAL '30 days'
WHERE user_id = 'user-id-here';

-- Or create new subscription
INSERT INTO subscriptions (id, user_id, plan, status, current_period_start, current_period_end)
VALUES (
  gen_random_uuid(),
  'user-id-here',
  'pro',
  'active',
  NOW(),
  NOW() + INTERVAL '30 days'
);
```

---

### Option 2: Feature Flag (User Role)

**Add role field to User model:**

```prisma
// packages/core/prisma/schema.prisma

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  role      String?  @default("free") // Add this
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Update user role:**

```sql
UPDATE users SET role = 'pro' WHERE email = 'vip@example.com';
```

**Tier detection automatically picks this up:**
```typescript
// Already implemented in getUserTier()
if (user.role === "pro" || user.role === "admin") {
  return "pro";
}
```

---

### Option 3: Stripe Integration (Future)

**When ready to add Stripe:**

1. **Keep existing code** - No refactor needed!
2. **Add Stripe webhook handler:**
   ```typescript
   // apps/web/app/api/webhooks/stripe/route.ts
   
   export async function POST(request: Request) {
     const event = await stripe.webhooks.constructEvent(
       await request.text(),
       request.headers.get('stripe-signature'),
       process.env.STRIPE_WEBHOOK_SECRET
     );
     
     if (event.type === 'checkout.session.completed') {
       const session = event.data.object;
       
       // Update subscription
       await prisma.subscription.upsert({
         where: { userId: session.metadata.userId },
         update: {
           plan: 'pro',
           status: 'active',
           stripeId: session.subscription,
           currentPeriodStart: new Date(session.current_period_start * 1000),
           currentPeriodEnd: new Date(session.current_period_end * 1000),
         },
         create: {
           userId: session.metadata.userId,
           plan: 'pro',
           status: 'active',
           stripeId: session.subscription,
           currentPeriodStart: new Date(session.current_period_start * 1000),
           currentPeriodEnd: new Date(session.current_period_end * 1000),
         },
       });
     }
   }
   ```

3. **Tier detection automatically uses subscription** - Already implemented!

---

## 🎨 UI Integration (Optional)

### Show Usage in UI

```typescript
// Example component
import { useEffect, useState } from 'react';

export function UsageWidget() {
  const [usage, setUsage] = useState(null);
  
  useEffect(() => {
    fetch('/api/usage')
      .then(res => res.json())
      .then(data => setUsage(data));
  }, []);
  
  if (!usage) return null;
  
  return (
    <div>
      <h3>{usage.tier === 'free' ? 'Free Plan' : 'Pro Plan'}</h3>
      <div>
        <p>Searches: {usage.usage.savedSearches.current} / {usage.usage.savedSearches.limit}</p>
        <progress value={usage.usage.savedSearches.percentage} max="100" />
      </div>
      <div>
        <p>Alerts: {usage.usage.activeAlerts.current} / {usage.usage.activeAlerts.limit}</p>
        <progress value={usage.usage.activeAlerts.percentage} max="100" />
      </div>
      {usage.upgradeAvailable && (
        <button>Upgrade to Pro</button>
      )}
    </div>
  );
}
```

---

## 🧪 Testing

### Test Free Tier Limits

```bash
# 1. Create 3 searches (should succeed)
for i in {1..3}; do
  curl -X POST https://flipperagents.com/api/searches \
    -H "Content-Type: application/json" \
    -H "Cookie: sb-access-token=$TOKEN" \
    -d "{\"name\":\"Test $i\",\"keywords\":[\"test\"],\"marketplace\":\"facebook\"}"
done

# 2. Try to create 4th search (should fail with MAX_SEARCHES_REACHED)
curl -X POST https://flipperagents.com/api/searches \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=$TOKEN" \
  -d '{"name":"Test 4","keywords":["test"],"marketplace":"facebook"}'
```

**Expected Error:**
```json
{
  "error": "You've reached the maximum number of saved searches for your plan.",
  "errorCode": "MAX_SEARCHES_REACHED",
  "currentPlan": "Free",
  "currentLimits": {
    "maxSavedSearches": 3
  }
}
```

---

### Test Pro Tier (Manual Upgrade)

```sql
-- Upgrade user to Pro
INSERT INTO subscriptions (id, user_id, plan, status, current_period_start, current_period_end)
VALUES (
  gen_random_uuid(),
  'your-user-id',
  'pro',
  'active',
  NOW(),
  NOW() + INTERVAL '30 days'
);
```

```bash
# Now try creating more searches (should succeed up to 50)
curl -X POST https://flipperagents.com/api/searches \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=$TOKEN" \
  -d '{"name":"Test Pro","keywords":["test"],"marketplace":"facebook"}'
```

---

## 📊 Monitoring

### Check User Tiers

```sql
SELECT 
  u.email,
  s.plan,
  s.status,
  COUNT(DISTINCT ss.id) as searches,
  COUNT(DISTINCT a.id) as alerts
FROM users u
LEFT JOIN subscriptions s ON u.id = s.user_id
LEFT JOIN saved_searches ss ON u.id = ss.user_id AND ss.is_active = true
LEFT JOIN alerts a ON u.id = a.user_id AND a.is_read = false
GROUP BY u.id, u.email, s.plan, s.status
ORDER BY s.plan DESC, u.email;
```

### Check Limit Violations

```sql
-- Users hitting search limit
SELECT 
  u.email,
  COALESCE(s.plan, 'free') as plan,
  COUNT(ss.id) as active_searches
FROM users u
LEFT JOIN subscriptions s ON u.id = s.user_id
LEFT JOIN saved_searches ss ON u.id = ss.user_id AND ss.is_active = true
GROUP BY u.id, u.email, s.plan
HAVING COUNT(ss.id) >= CASE 
  WHEN COALESCE(s.plan, 'free') = 'pro' THEN 50 
  ELSE 3 
END;
```

---

## 🔮 Future Extensions

### Easy to Add

The tier system is designed for easy extension:

```typescript
// Add new tier
export const TIER_CONFIG = {
  free: {...},
  pro: {...},
  enterprise: {  // ✨ New tier
    name: "enterprise",
    displayName: "Enterprise",
    price: 99,
    features: {
      maxSavedSearches: -1, // Unlimited
      maxActiveAlerts: -1,   // Unlimited
      marketplaces: ["facebook", "vinted", "ebay", "craigslist"],
      emailAlerts: true,
      inAppAlerts: true,
      apiAccess: true,       // ✨ Enable API
      prioritySupport: true,
      customWebhooks: true,  // ✨ New feature
    },
  },
};
```

### Add New Features

```typescript
// Check new feature
export async function canUseAPI(userId: string): Promise<boolean> {
  const userData = await getUserWithTier(userId);
  return userData?.limits.features.apiAccess ?? false;
}
```

---

## ✅ Summary

**Tier System Complete:**

- ✅ Free tier: 3 searches, 10 alerts, no email
- ✅ Pro tier: 50 searches, 1,000 alerts, email enabled
- ✅ Enforcement at 3 key points:
  1. Search creation API
  2. Alert creation service
  3. Alert delivery worker
- ✅ Clear error messages with upgrade CTA
- ✅ Usage API for frontend integration
- ✅ Easy to upgrade (manual or Stripe)
- ✅ Extensible for future tiers/features

**No Refactor Needed for Stripe:**
- Tier detection already checks subscriptions table
- Just add webhook handler when ready
- All limits and checks work automatically

---

**Last Updated:** 2025-12-13  
**Status:** ✅ Production Ready
