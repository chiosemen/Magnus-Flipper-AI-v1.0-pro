# STRIPE DEPLOYMENT PLAN

**Last Updated**: 2024-01-15  
**Purpose**: Stripe billing integration configuration for production

---

## PRICE IDs

### Subscription Tiers

Configure these products and prices in Stripe:

#### Basic Tier
- **Product Name**: Magnus Flipper AI - Basic
- **Price ID**: `price_basic_xxxxx` (LIVE) / `price_basic_test_xxxxx` (TEST)
- **Amount**: $X.XX/month
- **Billing Interval**: Monthly
- **Features**: Basic features

#### Pro Tier
- **Product Name**: Magnus Flipper AI - Pro
- **Price ID**: `price_pro_xxxxx` (LIVE) / `price_pro_test_xxxxx` (TEST)
- **Amount**: $X.XX/month
- **Billing Interval**: Monthly
- **Features**: Pro features

#### Premium Tier
- **Product Name**: Magnus Flipper AI - Premium
- **Price ID**: `price_premium_xxxxx` (LIVE) / `price_premium_test_xxxxx` (TEST)
- **Amount**: $X.XX/month
- **Billing Interval**: Monthly
- **Features**: Premium features

#### Admin Tier
- **Product Name**: Magnus Flipper AI - Admin
- **Price ID**: `price_admin_xxxxx` (LIVE) / `price_admin_test_xxxxx` (TEST)
- **Amount**: $X.XX/month (or custom)
- **Billing Interval**: Monthly
- **Features**: Admin access

### Environment Variables

Set these in Vercel:
- `STRIPE_PRICE_ID_BASIC`
- `STRIPE_PRICE_ID_PRO`
- `STRIPE_PRICE_ID_PREMIUM`
- `STRIPE_PRICE_ID_ADMIN`

---

## PRODUCT IDs

### Product Configuration

Each subscription tier should have:
- **Product ID**: `prod_xxxxx`
- **Price ID**: `price_xxxxx`
- **Metadata**: Tier name, features, etc.

### Product Metadata

Add metadata to products:
```json
{
  "tier": "basic",
  "features": "feature1,feature2,feature3",
  "max_listings": "10"
}
```

---

## TEST MODE → LIVE MODE SWITCHOVER

### Test Mode Setup

1. **Create Products in Test Mode**:
   - Go to Stripe Dashboard → Products
   - Create all subscription tiers
   - Note down Price IDs

2. **Configure Test Keys**:
   - Use `sk_test_xxxxx` for development
   - Use `pk_test_xxxxx` for client
   - Set `STRIPE_SECRET_KEY_TEST` in Vercel (preview environments)

3. **Test Webhooks**:
   - Use Stripe CLI: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
   - Test subscription creation
   - Test payment processing
   - Verify webhook events

### Live Mode Switchover

1. **Create Products in Live Mode**:
   - Go to Stripe Dashboard → Products (switch to Live mode)
   - Create same products as test mode
   - Note down LIVE Price IDs

2. **Update Environment Variables**:
   - Set `STRIPE_SECRET_KEY` (LIVE) in Vercel production
   - Set `STRIPE_PUBLISHABLE_KEY` (LIVE) in Vercel production
   - Update all Price ID variables with LIVE values

3. **Configure Live Webhook**:
   - Create webhook endpoint in Stripe dashboard
   - Set URL: `https://[your-domain]/api/stripe/webhook`
   - Select events to listen to
   - Copy webhook signing secret
   - Set `STRIPE_WEBHOOK_SECRET` in Vercel

4. **Verify Switchover**:
   - Test subscription creation with LIVE keys
   - Verify webhook events received
   - Check database updates
   - Test payment processing

---

## WEBHOOK SIGNING SECRET SETUP

### Webhook Endpoint

**URL**: `https://[your-domain]/api/stripe/webhook`

### Required Events

Configure webhook to listen to:
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `customer.subscription.trial_will_end`
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `invoice.payment_action_required`
- `customer.updated`
- `payment_method.attached`

### Webhook Secret

1. **Create Webhook in Stripe Dashboard**:
   - Go to Developers → Webhooks
   - Click "Add endpoint"
   - Enter webhook URL
   - Select events
   - Click "Add endpoint"

2. **Retrieve Signing Secret**:
   - Click on webhook endpoint
   - Click "Reveal" next to "Signing secret"
   - Copy secret (starts with `whsec_`)

3. **Set in Environment Variables**:
   - Add `STRIPE_WEBHOOK_SECRET` to Vercel
   - Use TEST secret for preview environments
   - Use LIVE secret for production

### Webhook Verification

The webhook handler verifies signatures:

```typescript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

const signature = request.headers.get('stripe-signature');
const event = stripe.webhooks.constructEvent(
  body,
  signature!,
  webhookSecret
);
```

---

## CUSTOMER PORTAL CONFIGURATION

### Stripe Customer Portal

Configure in Stripe Dashboard:

1. **Go to Settings → Billing → Customer Portal**
2. **Enable Customer Portal**
3. **Configure Features**:
   - [ ] Allow customers to update payment method
   - [ ] Allow customers to cancel subscriptions
   - [ ] Allow customers to update billing information
   - [ ] Allow customers to view invoices
   - [ ] Allow customers to view payment history

### Portal URL

Access portal via:
- API route: `/api/stripe/portal`
- Creates portal session and redirects customer

### Portal Session Creation

```typescript
const session = await stripe.billingPortal.sessions.create({
  customer: customerId,
  return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings`,
});
```

---

## PAYMENT METHOD CONFIGURATION

### Supported Payment Methods

- **Credit Cards**: Visa, Mastercard, American Express, Discover
- **Debit Cards**: Supported
- **Digital Wallets**: Apple Pay, Google Pay (if enabled)

### Payment Method Collection

Configure in checkout session:
```typescript
const session = await stripe.checkout.sessions.create({
  payment_method_types: ['card'],
  // ... other config
});
```

---

## SUBSCRIPTION MANAGEMENT

### Subscription Lifecycle

1. **Creation**: Customer subscribes via checkout
2. **Activation**: Webhook `customer.subscription.created`
3. **Updates**: Webhook `customer.subscription.updated`
4. **Cancellation**: Webhook `customer.subscription.deleted`
5. **Renewal**: Automatic via Stripe

### Subscription Status Mapping

Map Stripe subscription status to app tiers:
- `active` → Active subscription
- `trialing` → Trial period
- `past_due` → Payment failed, retrying
- `canceled` → Subscription canceled
- `unpaid` → Payment failed, subscription ended

---

## TESTING CHECKLIST

### Test Mode Testing

- [ ] Create test customer
- [ ] Create test subscription
- [ ] Test payment success
- [ ] Test payment failure
- [ ] Test subscription update
- [ ] Test subscription cancellation
- [ ] Test webhook events
- [ ] Verify database updates

### Live Mode Testing

- [ ] Create real subscription (small amount)
- [ ] Verify payment processing
- [ ] Test webhook events
- [ ] Test customer portal
- [ ] Test subscription management
- [ ] Verify all features work

---

## SECURITY CHECKLIST

- [ ] Webhook signature verification enabled
- [ ] Secret keys stored securely (never in client)
- [ ] Publishable keys safe for client use
- [ ] Webhook endpoint requires signature
- [ ] Rate limiting on webhook endpoint
- [ ] Idempotency keys used for critical operations

---

## MONITORING

### Stripe Dashboard

Monitor:
- Revenue
- Active subscriptions
- Failed payments
- Webhook delivery
- API usage

### Alerts

Set up alerts for:
- Failed payments
- Webhook delivery failures
- High chargeback rate
- Unusual activity

---

## TROUBLESHOOTING

### Common Issues

1. **Webhook Not Receiving Events**:
   - Verify webhook URL is correct
   - Check webhook secret matches
   - Verify endpoint is accessible
   - Check Stripe dashboard for delivery logs

2. **Payment Failures**:
   - Check card details
   - Verify payment method is valid
   - Check Stripe logs for error details

3. **Subscription Not Updating**:
   - Verify webhook handler is working
   - Check database update logic
   - Verify webhook events are being processed

---

## NEXT STEPS

1. ✅ Create products in Stripe (TEST mode)
2. ✅ Configure test webhook
3. ✅ Test subscription flow
4. ✅ Create products in Stripe (LIVE mode)
5. ✅ Configure live webhook
6. ✅ Update environment variables
7. ✅ Test live subscription flow
8. ✅ Configure customer portal
9. ✅ Set up monitoring

---

**END OF STRIPE DEPLOYMENT PLAN**

