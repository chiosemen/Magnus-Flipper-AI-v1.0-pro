# Tier System - Quick Reference

> Paywall limits for searches and alerts

---

## 📊 Limits at a Glance

| Limit | Free | Pro |
|-------|------|-----|
| **Saved Searches** | 3 | 50 |
| **Active Alerts** | 10 | 1,000 |
| **Email Alerts** | ❌ | ✅ |
| **Price** | $0 | $29/mo |

---

## 🔒 Enforcement Locations

### 1. Search Creation

**File:** `apps/web/app/api/searches/route.ts`  
**Line:** ~40-55  
**Limit:** 3 (Free) / 50 (Pro)

```typescript
const searchCheck = await canCreateSearch(user.id);
if (!searchCheck.allowed) {
  return NextResponse.json(
    formatLimitError("MAX_SEARCHES_REACHED", tier),
    { status: 403 }
  );
}
```

---

### 2. Alert Creation

**File:** `packages/core/src/alerts/alert-service.ts`  
**Line:** ~45-52  
**Limit:** 10 (Free) / 1,000 (Pro)

```typescript
const alertCheck = await canReceiveAlert(userId);
if (!alertCheck.allowed) {
  return { created: false, reason: "MAX_ALERTS_REACHED" };
}
```

---

### 3. Email Delivery

**File:** `packages/core/src/alerts/alert-delivery-worker.ts`  
**Line:** ~62-85  
**Limit:** ❌ (Free) / ✅ (Pro)

```typescript
const emailCheck = await canReceiveEmailAlerts(alert.userId);
if (!emailCheck.allowed) {
  // Skip email for free tier
}
```

---

## 🎯 Key Functions

```typescript
// Check if user can create search
const { allowed } = await canCreateSearch(userId);

// Check if user can receive alert
const { allowed } = await canReceiveAlert(userId);

// Check if user can get email alerts
const { allowed } = await canReceiveEmailAlerts(userId);

// Get usage stats
const stats = await getUserUsageStats(userId);
```

---

## 🚀 Upgrade User (Manual)

```sql
-- Option 1: Via subscription
INSERT INTO subscriptions (id, user_id, plan, status, current_period_start, current_period_end)
VALUES (gen_random_uuid(), 'user-id', 'pro', 'active', NOW(), NOW() + INTERVAL '30 days');

-- Option 2: Via role (if role field added)
UPDATE users SET role = 'pro' WHERE id = 'user-id';
```

---

## 📡 Check Usage API

```bash
# GET /api/usage
curl https://flipperagents.com/api/usage \
  -H "Cookie: sb-access-token=$TOKEN"
```

**Response:**
```json
{
  "tier": "free",
  "usage": {
    "savedSearches": { "current": 2, "limit": 3 },
    "activeAlerts": { "current": 5, "limit": 10 }
  }
}
```

---

## ❌ Error Response

```json
{
  "error": "You've reached the maximum number of saved searches for your plan.",
  "errorCode": "MAX_SEARCHES_REACHED",
  "upgrade": "Upgrade to Pro to create up to 50 searches.",
  "currentPlan": "Free",
  "proPlan": {
    "displayName": "Pro",
    "price": 29,
    "maxSavedSearches": 50
  }
}
```

---

## 🔄 Upgrade Path (Future)

**Add Stripe webhook only:**
```typescript
// apps/web/app/api/webhooks/stripe/route.ts
await prisma.subscription.upsert({
  where: { userId },
  update: { plan: 'pro', status: 'active' },
});
```

**No other changes needed!**

---

## 📚 Full Docs

- **Complete Guide:** `docs/TIER_SYSTEM.md`
- **Implementation:** `TIER_SYSTEM_IMPLEMENTATION.md`
- **This File:** `docs/TIER_SYSTEM_QUICK_REF.md`

---

**Status:** ✅ Production Ready
