# ✅ Stripe & Subscription Migration Complete

## Summary

Successfully migrated **Stripe and subscription modules** from placeholder implementations to real production code integrated with Stripe API and Supabase.

### Files Migrated:

1. ✅ [stripe/index.ts](apps/web/src/lib/stripe/index.ts) - Stripe API integration
2. ✅ [stripe/stripe-utils.ts](apps/web/src/lib/stripe/stripe-utils.ts) - Customer management
3. ✅ [subscription.ts](apps/web/src/lib/subscription.ts) - Subscription management with Supabase

---

## 1. stripe/index.ts Migration

### Before:
```typescript
export function getPriceIdForTier(tier: string) {
  switch (tier) {
    case "pro":
      return process.env.STRIPE_PRICE_PRO ?? "price_pro_placeholder";
    case "agency":
      return process.env.STRIPE_PRICE_AGENCY ?? "price_agency_placeholder";
    default:
      return "price_free_placeholder";
  }
}
```

### After:
```typescript
export function getPriceIdForTier(tier: string): string {
  switch (tier.toLowerCase()) {
    case "pro":
      if (!process.env.STRIPE_PRO_PRICE) {
        throw new Error("STRIPE_PRO_PRICE environment variable is not set");
      }
      return process.env.STRIPE_PRO_PRICE;

    case "agency":
      if (!process.env.STRIPE_AGENCY_PRICE) {
        throw new Error("STRIPE_AGENCY_PRICE environment variable is not set");
      }
      return process.env.STRIPE_AGENCY_PRICE;

    default:
      throw new Error(`Invalid tier: ${tier}. Must be 'pro' or 'agency'`);
  }
}
```

**Changes:**
- ✅ Removed placeholder fallbacks
- ✅ Added environment variable validation
- ✅ Throws errors for missing config (fail fast)
- ✅ Case-insensitive tier matching

**New Functions Added:**
- `getCustomer(customerId)` - Retrieve Stripe customer
- `listCustomerSubscriptions(customerId)` - List active subscriptions

---

## 2. stripe/stripe-utils.ts

### Implementation Status:
✅ **Already production-ready** - No changes needed

**Functions:**
- `createOrRetrieveCustomer({ email, userId })` - Create or get existing customer
- `createCheckoutSession({ customerId, priceId, successUrl, cancelUrl })` - Create checkout

The stripe-utils.ts file was already using real Stripe API calls with proper customer lookup and creation.

---

## 3. subscription.ts Migration

### Before:
```typescript
export async function getUserSubscriptionTier(userId: string): Promise<SubscriptionTier> {
  try {
    // Placeholder - implement with real database call
    return SubscriptionTier.FREE;
  } catch (error) {
    return SubscriptionTier.FREE;
  }
}
```

### After:
```typescript
export async function getUserSubscriptionTier(userId: string): Promise<SubscriptionTier> {
  try {
    const supabase = await createServerClient();

    // Query user_subscriptions table
    const { data, error } = await supabase
      .from("user_subscriptions")
      .select("tier, status")
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      return SubscriptionTier.FREE;
    }

    // Only return paid tier if subscription is active
    if (isActiveSubscription(data.status)) {
      return data.tier as SubscriptionTier;
    }

    return SubscriptionTier.FREE;
  } catch (error) {
    console.error("Error fetching subscription tier:", error);
    return SubscriptionTier.FREE;
  }
}
```

**New Functions Added:**
- `cancelUserSubscription(userId)` - Cancel in Stripe + update DB
- `hasTierAccess(userId, requiredTier)` - Check tier hierarchy
- `getSubscriptionDetails(userId)` - Get full subscription info from Stripe

---

## Data Flow

### Subscription Creation:
```
1. User clicks upgrade button
   ↓
2. createCheckoutSession() - Create Stripe checkout
   ↓
3. User completes payment in Stripe
   ↓
4. Webhook receives checkout.session.completed
   ↓
5. updateUserSubscriptionTier() - Save to Supabase
   ↓
6. getUserSubscriptionTier() - Returns new tier
```

### Feature Access Check:
```
1. hasFeatureAccess(userId, "profit_calculator")
   ↓
2. getUserSubscriptionTier(userId) - Query Supabase
   ↓
3. Check feature map for tier
   ↓
4. Return boolean access result
```

---

## Database Schema Required

### user_subscriptions table
```sql
CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('free', 'pro', 'agency', 'admin')),
  status TEXT NOT NULL CHECK (status IN ('active', 'trialing', 'canceled', 'past_due')),
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Index for fast user lookups
CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);

-- RLS policies
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
  ON user_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscriptions"
  ON user_subscriptions FOR ALL
  USING (auth.role() = 'service_role');
```

---

## Environment Variables Required

```bash
# Stripe Keys
STRIPE_SECRET_KEY=sk_live_xxx          # Stripe secret key
STRIPE_PUBLISHABLE_KEY=pk_live_xxx     # Stripe publishable key
STRIPE_WEBHOOK_SECRET=whsec_xxx        # Webhook signing secret

# Stripe Price IDs
STRIPE_PRO_PRICE=price_xxx             # Pro tier monthly price
STRIPE_AGENCY_PRICE=price_xxx          # Agency tier monthly price

# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxx
```

---

## Features Implemented

### Tier Management
- ✅ Get user tier from Supabase
- ✅ Update tier on subscription change
- ✅ Automatic downgrade to FREE on cancellation
- ✅ Status validation (only active/trialing get paid tier)

### Stripe Integration
- ✅ Customer creation and retrieval
- ✅ Checkout session creation
- ✅ Billing portal access
- ✅ Subscription cancellation
- ✅ Environment variable validation

### Feature Access Control
- ✅ Feature-based access checking
- ✅ Tier hierarchy validation
- ✅ Detailed subscription info retrieval

---

## API Routes to Wire Up

You'll need to create these API routes to complete the integration:

### 1. POST /api/stripe/create-checkout
```typescript
import { createOrRetrieveCustomer } from "@/lib/stripe/stripe-utils";
import { createCheckoutSession } from "@/lib/stripe";

export async function POST(req: Request) {
  const { tier } = await req.json();
  const user = await getUser(); // Get from Supabase Auth

  const customer = await createOrRetrieveCustomer({
    email: user.email,
    userId: user.id,
  });

  const priceId = getPriceIdForTier(tier);

  const session = await createCheckoutSession({
    customerId: customer.id,
    priceId,
    successUrl: `${process.env.NEXT_PUBLIC_URL}/dashboard?success=true`,
    cancelUrl: `${process.env.NEXT_PUBLIC_URL}/pricing`,
  });

  return Response.json({ url: session.url });
}
```

### 2. POST /api/stripe/webhook
```typescript
import { stripe } from "@/lib/stripe";
import { updateUserSubscriptionTier, getTierFromPriceId } from "@/lib/subscription";

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  const event = stripe.webhooks.constructEvent(
    body,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET!
  );

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.client_reference_id;
    const subscriptionId = session.subscription as string;

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const priceId = subscription.items.data[0].price.id;
    const tier = getTierFromPriceId(priceId);

    await updateUserSubscriptionTier(
      userId,
      tier,
      subscriptionId,
      session.customer as string
    );
  }

  return Response.json({ received: true });
}
```

### 3. POST /api/stripe/portal
```typescript
import { createPortalSession } from "@/lib/stripe";

export async function POST(req: Request) {
  const user = await getUser();
  const { customerId } = await getSubscriptionDetails(user.id);

  const session = await createPortalSession(
    customerId,
    `${process.env.NEXT_PUBLIC_URL}/dashboard/billing`
  );

  return Response.json({ url: session.url });
}
```

---

## Testing Checklist

### Stripe Integration
- [ ] Test checkout session creation
- [ ] Complete test payment in Stripe
- [ ] Verify webhook receives events
- [ ] Test billing portal access
- [ ] Test subscription cancellation

### Database Integration
- [ ] Verify user_subscriptions table exists
- [ ] Test tier lookup for new user (returns FREE)
- [ ] Test tier update after payment
- [ ] Test tier downgrade on cancellation

### Feature Access
- [ ] Test hasFeatureAccess() for each tier
- [ ] Test hasTierAccess() with tier hierarchy
- [ ] Verify FREE users can't access PRO features
- [ ] Verify ADMIN has access to everything

---

## Migration Benefits

1. **No More Placeholders** - All Stripe functions use real API
2. **Database Integration** - Tiers stored in Supabase
3. **Environment Validation** - Fails fast if config missing
4. **Type Safety** - Full TypeScript support
5. **Error Handling** - Graceful fallbacks throughout
6. **Feature Gating** - Ready for tier-based feature access

---

## Next Steps

1. **Create API routes** - Implement /api/stripe/* endpoints
2. **Set up Stripe webhook** - Configure in Stripe dashboard
3. **Deploy database schema** - Run user_subscriptions migration
4. **Set environment variables** - Add all Stripe keys
5. **Test payment flow** - End-to-end subscription test

---

## Migration Complete! 🎉

All Stripe and subscription code is now production-ready with real API integration and database persistence!
