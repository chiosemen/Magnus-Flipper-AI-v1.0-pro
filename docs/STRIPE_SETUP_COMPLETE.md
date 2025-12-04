# Stripe Production Setup - Complete Guide

**Complete Stripe integration for Magnus Flipper AI with products, webhooks, and billing portal**

---

## 📦 Overview

This guide covers the complete Stripe setup:
1. **Products & Prices** - Free, Pro ($29/mo), Agency ($99/mo)
2. **Billing Portal** - Customer self-service
3. **Webhooks** - 6 event handlers
4. **API Routes** - Next.js App Router integration
5. **Server Utilities** - Customer management
6. **Environment Variables** - All platforms

---

## 🏷️ STEP 1: Create Products in Stripe Dashboard

### Navigate to Stripe Dashboard

```
https://dashboard.stripe.com/products
→ Click "Add product"
```

### Product 1: Free Tier

```
Name: Magnus Flipper AI - Free
Description: Get started with basic marketplace scraping
Pricing: Free (no charge)
Billing period: N/A (free forever)

Features:
- 10 scrapes per day
- Basic deal scoring
- 1 marketplace
- Email support

Skip product creation in Stripe (no payment required)
Handle in Supabase: tier = 'free', is_active = true
```

### Product 2: Pro Tier

```
Name: Magnus Flipper AI - Pro
Description: Unlock unlimited scraping and advanced deal scoring
Pricing: $29 USD per month
Billing period: Monthly (recurring)

Price ID: price_xxxxx (save this for code)

Features:
- Unlimited scrapes
- Advanced AI deal scoring
- 5 marketplaces
- Priority email support
- API access (60 req/min)
- Auto-buyer (coming soon)
```

**Stripe Dashboard Steps**:
1. Click "Add product"
2. Enter name and description
3. Pricing model: "Recurring"
4. Price: $29.00 USD
5. Billing period: Monthly
6. Click "Save product"
7. **Copy the Price ID** (e.g., `price_1Abc123xyz`)

### Product 3: Agency Tier

```
Name: Magnus Flipper AI - Agency
Description: Enterprise-grade automation for reselling businesses
Pricing: $99 USD per month
Billing period: Monthly (recurring)

Price ID: price_yyyyy (save this for code)

Features:
- Everything in Pro
- Unlimited marketplaces
- Auto-lister + Auto-buyer
- Priority chat support
- API access (120 req/min)
- White-label options
- Dedicated account manager
```

**Stripe Dashboard Steps**:
1. Click "Add product"
2. Enter name and description
3. Pricing model: "Recurring"
4. Price: $99.00 USD
5. Billing period: Monthly
6. Click "Save product"
7. **Copy the Price ID** (e.g., `price_2Def456uvw`)

---

## 🔑 STEP 2: Configure Billing Portal

### Navigate to Billing Portal Settings

```
https://dashboard.stripe.com/settings/billing/portal
→ Click "Activate portal"
```

### Portal Configuration

**Features to Enable**:
- ✅ **Update payment method** - Allow customers to update cards
- ✅ **View billing history** - Show invoices and receipts
- ✅ **Cancel subscription** - Allow immediate or end-of-period cancellation
- ✅ **Switch plans** - Allow upgrade/downgrade between Pro and Agency

**Cancellation Settings**:
- ✅ Offer to pause subscription (optional)
- ✅ Cancel at period end (default)
- ❌ Cancel immediately (not recommended)

**Branding**:
- Upload logo (recommended size: 300x100px)
- Primary color: `#3B82F6` (blue)
- Background color: `#FFFFFF` (white)

**Custom Text**:
- Terms of service URL: `https://flipperagents.com/terms`
- Privacy policy URL: `https://flipperagents.com/privacy`

**Save Configuration**

---

## 🪝 STEP 3: Configure Webhooks

### Navigate to Webhooks

```
https://dashboard.stripe.com/webhooks
→ Click "Add endpoint"
```

### Webhook Endpoint

**URL**:
```
Production: https://your-project.supabase.co/functions/v1/subscriptions-update
Development: Use Stripe CLI forwarding (see below)
```

**Events to Select**:
- ✅ `customer.created`
- ✅ `customer.updated`
- ✅ `checkout.session.completed`
- ✅ `customer.subscription.created`
- ✅ `customer.subscription.updated`
- ✅ `customer.subscription.deleted`
- ✅ `invoice.payment_succeeded`
- ✅ `invoice.payment_failed`

**API Version**: Latest (2023-10-16 or newer)

**Click "Add endpoint"**

### Save Webhook Signing Secret

After creating the webhook, Stripe will show the **signing secret**:
```
whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**IMPORTANT**: Copy this immediately and save to:
1. Supabase Secrets: `STRIPE_WEBHOOK_SECRET`
2. Vercel Environment Variables: `STRIPE_WEBHOOK_SECRET`

---

## 💻 STEP 4: Create API Routes

### Create Webhook Handler

**File**: `apps/web/app/api/stripe/webhook/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  console.log(`✅ Webhook received: ${event.type}`);

  try {
    switch (event.type) {
      case "customer.created":
        await handleCustomerCreated(event.data.object as Stripe.Customer);
        break;

      case "checkout.session.completed":
        await handleCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session
        );
        break;

      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

// =====================================================
// WEBHOOK HANDLERS
// =====================================================

async function handleCustomerCreated(customer: Stripe.Customer) {
  console.log("👤 Customer created:", customer.id);

  // Optionally store customer metadata in Supabase
  if (customer.email) {
    const { error } = await supabase
      .from("users")
      .update({
        metadata: {
          stripe_customer_id: customer.id,
        },
      })
      .eq("email", customer.email);

    if (error) {
      console.error("Error updating user with customer ID:", error);
    }
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log("💳 Checkout completed:", session.id);

  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  // Get subscription details
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  // Determine tier from price ID
  const priceId = subscription.items.data[0]?.price.id;
  const tier = getTierFromPriceId(priceId);

  // Get user by email
  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("email", session.customer_email)
    .single();

  if (!user) {
    console.error("User not found:", session.customer_email);
    return;
  }

  // Update subscription in Supabase
  await supabase.from("subscriptions").upsert({
    user_id: user.id,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscriptionId,
    stripe_price_id: priceId,
    tier,
    is_active: true,
    payment_status: "active",
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  });

  console.log(`✅ Subscription activated: ${tier} tier for ${session.customer_email}`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log("🔄 Subscription updated:", subscription.id);

  const priceId = subscription.items.data[0]?.price.id;
  const tier = getTierFromPriceId(priceId);

  await supabase
    .from("subscriptions")
    .update({
      stripe_price_id: priceId,
      tier,
      is_active: subscription.status === "active" || subscription.status === "trialing",
      payment_status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000).toISOString()
        : null,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id);

  console.log(`✅ Subscription updated to ${tier} tier`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log("❌ Subscription deleted:", subscription.id);

  await supabase
    .from("subscriptions")
    .update({
      tier: "free",
      is_active: false,
      payment_status: "canceled",
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id);

  console.log("✅ User downgraded to free tier");
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log("💰 Invoice paid:", invoice.id);

  if (invoice.subscription) {
    await supabase
      .from("subscriptions")
      .update({
        payment_status: "active",
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_subscription_id", invoice.subscription as string);
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log("⚠️ Invoice payment failed:", invoice.id);

  if (invoice.subscription) {
    await supabase
      .from("subscriptions")
      .update({
        payment_status: "past_due",
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_subscription_id", invoice.subscription as string);
  }
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function getTierFromPriceId(priceId: string): string {
  const PRICE_TO_TIER: Record<string, string> = {
    [process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO!]: "pro",
    [process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_AGENCY!]: "agency",
  };

  return PRICE_TO_TIER[priceId] || "free";
}
```

### Create Upgrade API Route

**File**: `apps/web/app/api/stripe/upgrade/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { createOrRetrieveCustomer } from "@/lib/stripe/stripe-utils";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get authenticated user
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const { tier } = await req.json();

    if (!tier || !["pro", "agency"].includes(tier)) {
      return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
    }

    // Get price ID for tier
    const priceId =
      tier === "pro"
        ? process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO
        : process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_AGENCY;

    // Get or create Stripe customer
    const customerId = await createOrRetrieveCustomer(user.id, user.email!);

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgraded=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
      metadata: {
        user_id: user.id,
        tier,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
```

### Create Manage Billing API Route

**File**: `apps/web/app/api/stripe/manage-billing/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get authenticated user
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's Stripe customer ID
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single();

    if (!subscription?.stripe_customer_id) {
      return NextResponse.json(
        { error: "No Stripe customer found" },
        { status: 404 }
      );
    }

    // Create billing portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error("Error creating billing portal session:", error);
    return NextResponse.json(
      { error: "Failed to create billing portal session" },
      { status: 500 }
    );
  }
}
```

---

## 🛠️ STEP 5: Create Server Utilities

**File**: `apps/web/lib/stripe/stripe-utils.ts`

```typescript
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Create or retrieve Stripe customer for user
 */
export async function createOrRetrieveCustomer(
  userId: string,
  email: string
): Promise<string> {
  // Check if customer already exists in Supabase
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .single();

  if (subscription?.stripe_customer_id) {
    return subscription.stripe_customer_id;
  }

  // Check if customer exists in Stripe by email
  const existingCustomers = await stripe.customers.list({
    email,
    limit: 1,
  });

  if (existingCustomers.data.length > 0) {
    const customerId = existingCustomers.data[0].id;

    // Update Supabase with existing customer ID
    await supabase
      .from("subscriptions")
      .update({ stripe_customer_id: customerId })
      .eq("user_id", userId);

    return customerId;
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email,
    metadata: {
      supabase_user_id: userId,
    },
  });

  // Update Supabase with new customer ID
  await supabase
    .from("subscriptions")
    .update({ stripe_customer_id: customer.id })
    .eq("user_id", userId);

  return customer.id;
}

/**
 * Get user's subscription tier
 */
export async function getUserTier(userId: string): Promise<string> {
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("tier, is_active")
    .eq("user_id", userId)
    .single();

  if (!subscription || !subscription.is_active) {
    return "free";
  }

  return subscription.tier;
}

/**
 * Check if user has active subscription
 */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("is_active, tier")
    .eq("user_id", userId)
    .single();

  return (
    subscription?.is_active &&
    ["pro", "agency", "admin"].includes(subscription.tier)
  );
}

/**
 * Cancel subscription at period end
 */
export async function cancelSubscription(userId: string): Promise<void> {
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("stripe_subscription_id")
    .eq("user_id", userId)
    .single();

  if (!subscription?.stripe_subscription_id) {
    throw new Error("No active subscription found");
  }

  await stripe.subscriptions.update(subscription.stripe_subscription_id, {
    cancel_at_period_end: true,
  });
}

/**
 * Reactivate canceled subscription
 */
export async function reactivateSubscription(userId: string): Promise<void> {
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("stripe_subscription_id")
    .eq("user_id", userId)
    .single();

  if (!subscription?.stripe_subscription_id) {
    throw new Error("No subscription found");
  }

  await stripe.subscriptions.update(subscription.stripe_subscription_id, {
    cancel_at_period_end: false,
  });
}
```

---

## 🔐 STEP 6: Environment Variables

### Vercel Environment Variables

```bash
# Navigate to Vercel Dashboard → Settings → Environment Variables

# Stripe Keys (Get from https://dashboard.stripe.com/apikeys)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs (Get from Products page)
NEXT_PUBLIC_STRIPE_PRICE_ID_PRO=price_xxxxx
NEXT_PUBLIC_STRIPE_PRICE_ID_AGENCY=price_yyyyy

# App URL
NEXT_PUBLIC_APP_URL=https://flipperagents.com
```

### Supabase Secrets (for Edge Functions)

```bash
# Set secrets for Edge Functions
supabase secrets set \
  STRIPE_SECRET_KEY=sk_live_... \
  STRIPE_WEBHOOK_SECRET=whsec_... \
  STRIPE_PRICE_ID_PRO=price_xxxxx \
  STRIPE_PRICE_ID_AGENCY=price_yyyyy
```

### Local Development (`.env.local`)

```bash
# Stripe Test Keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Test Price IDs
NEXT_PUBLIC_STRIPE_PRICE_ID_PRO=price_test_xxxxx
NEXT_PUBLIC_STRIPE_PRICE_ID_AGENCY=price_test_yyyyy

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

---

## 🧪 STEP 7: Testing

### Test Mode vs Production Mode

**Test Mode** (for development):
- Use test API keys (`pk_test_...`, `sk_test_...`)
- Use test price IDs
- Use test cards: `4242 4242 4242 4242` (Visa)
- No real charges

**Production Mode** (for live):
- Use live API keys (`pk_live_...`, `sk_live_...`)
- Use live price IDs
- Real credit cards
- Real charges

### Local Webhook Testing with Stripe CLI

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Test webhook events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
stripe trigger invoice.payment_succeeded
```

### Test Checkout Flow

1. **Create checkout session**:
```bash
curl -X POST http://localhost:3000/api/stripe/upgrade \
  -H "Authorization: Bearer <jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{"tier": "pro"}'
```

2. **Use test card**:
- Card number: `4242 4242 4242 4242`
- Expiry: Any future date
- CVC: Any 3 digits
- ZIP: Any 5 digits

3. **Verify subscription in Supabase**:
```sql
SELECT tier, is_active, stripe_subscription_id
FROM subscriptions
WHERE user_id = 'user-uuid';
```

### Test Billing Portal

```bash
curl -X POST http://localhost:3000/api/stripe/manage-billing \
  -H "Authorization: Bearer <jwt-token>"

# Returns: { "url": "https://billing.stripe.com/session/..." }
# Visit the URL to test the billing portal
```

---

## 📊 Monitoring & Analytics

### Stripe Dashboard Metrics

**Key Metrics to Monitor**:
- Monthly Recurring Revenue (MRR)
- Active subscriptions by tier
- Churn rate
- Failed payments
- Refunds

**Access**:
```
https://dashboard.stripe.com/dashboard
```

### Query Subscription Analytics in Supabase

```sql
-- Active subscriptions by tier
SELECT tier, COUNT(*) AS count
FROM subscriptions
WHERE is_active = true
GROUP BY tier;

-- Recent upgrades
SELECT u.email, s.tier, s.created_at
FROM subscriptions s
JOIN users u ON s.user_id = u.id
WHERE s.tier IN ('pro', 'agency')
  AND s.created_at > NOW() - INTERVAL '7 days'
ORDER BY s.created_at DESC;

-- Churned users (canceled in last 30 days)
SELECT u.email, s.tier, s.canceled_at
FROM subscriptions s
JOIN users u ON s.user_id = u.id
WHERE s.canceled_at > NOW() - INTERVAL '30 days'
ORDER BY s.canceled_at DESC;

-- Revenue forecast (MRR)
SELECT
  SUM(CASE WHEN tier = 'pro' THEN 29 ELSE 0 END) +
  SUM(CASE WHEN tier = 'agency' THEN 99 ELSE 0 END) AS mrr
FROM subscriptions
WHERE is_active = true;
```

---

## 🚨 Error Handling & Troubleshooting

### Common Issues

**Issue: Webhook signature verification fails**
```
Error: No signatures found matching the expected signature for payload
```

**Solution**:
1. Verify webhook secret matches Stripe Dashboard
2. Check that raw request body is passed to webhook verifier
3. Ensure no body parsing middleware interferes

**Issue: Customer already exists error**
```
Error: Customer already exists with email
```

**Solution**: Use `createOrRetrieveCustomer` utility instead of creating directly

**Issue: Subscription not updating in Supabase**
```
Webhook received but database not updated
```

**Solution**:
1. Check Supabase RLS policies allow service role
2. Verify `SUPABASE_SERVICE_ROLE_KEY` is set correctly
3. Check webhook handler logs for errors

### Webhook Debugging

**View webhook logs in Stripe Dashboard**:
```
https://dashboard.stripe.com/webhooks
→ Click your webhook endpoint
→ View "Events sent" tab
```

**Check response status**:
- ✅ 200: Webhook processed successfully
- ⚠️ 4xx: Client error (bad request, signature failed)
- ❌ 5xx: Server error (handler crashed)

**Retry failed webhooks**:
Stripe automatically retries failed webhooks with exponential backoff (up to 3 days)

---

## 🔒 Security Best Practices

### 1. Always Verify Webhook Signatures
```typescript
// ❌ BAD - No verification
const event = await req.json();

// ✅ GOOD - Verify signature
const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
```

### 2. Use Service Role Key for Supabase
```typescript
// ✅ Service role bypasses RLS policies
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Not anon key
);
```

### 3. Store Sensitive Keys Securely
- ❌ Never commit `.env` files to git
- ✅ Use Vercel environment variables
- ✅ Use Supabase secrets for Edge Functions
- ✅ Rotate keys every 90 days

### 4. Validate User Authentication
```typescript
// Always check user is authenticated before creating checkout
const { data: { user }, error } = await supabase.auth.getUser(token);
if (!user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

---

## 📋 Production Checklist

### Before Going Live

- [ ] Switch from test mode to live mode in Stripe Dashboard
- [ ] Update environment variables to use live keys
- [ ] Create live products and save live price IDs
- [ ] Configure live webhook endpoint URL
- [ ] Test live checkout with real card (refund immediately)
- [ ] Verify webhook signature verification works
- [ ] Test billing portal with live subscription
- [ ] Set up Stripe Radar for fraud detection
- [ ] Configure email receipts in Stripe Dashboard
- [ ] Review Stripe tax settings (if applicable)
- [ ] Set up bank account for payouts

### After Going Live

- [ ] Monitor webhook events in Stripe Dashboard
- [ ] Check Supabase subscriptions table for accuracy
- [ ] Verify MRR calculations match Stripe Dashboard
- [ ] Test customer support flow (billing questions)
- [ ] Monitor failed payment rates
- [ ] Set up alerts for high churn rates

---

## 🎉 Complete Integration Summary

**What You've Built**:
- ✅ 3 subscription tiers (Free, Pro, Agency)
- ✅ Stripe Checkout integration
- ✅ Customer Billing Portal
- ✅ 6 webhook event handlers
- ✅ Automatic subscription sync to Supabase
- ✅ Customer management utilities
- ✅ Upgrade/downgrade flows
- ✅ Cancellation handling

**API Routes Created**:
- `POST /api/stripe/webhook` - Webhook handler
- `POST /api/stripe/upgrade` - Create checkout session
- `POST /api/stripe/manage-billing` - Billing portal access

**Total Files Created**: 4
- 1 webhook handler
- 2 API routes
- 1 utility file

**Deployment Time**: ~30 minutes

---

**Last Updated**: December 2, 2024
**Stripe API Version**: 2023-10-16
**Status**: Production Ready ✅
