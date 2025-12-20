# Stripe Products & Prices (Magnus Flipper)

This document defines the canonical Stripe Product/Price structure for Magnus Flipper so the app can select the correct Stripe **Price ID** per user region without doing any FX conversion or price math in-app.

## 1) Product Strategy (1 Product per plan)

Create **one Stripe Product per plan**:

- **Starter**
- **Pro**
- **Elite**

Each Product represents the plan concept (features + entitlement tier). Prices are attached to the Product.

## 2) Price Strategy (multiple Prices per Product)

Each Product has **multiple Stripe Prices**:

- **One Price per currency per billing period** (no dynamic conversion)
- Example billing periods: `monthly` (and later `annual` if/when added)

### Example

**Product: Pro**

- `price_pro_usd_monthly` → `$99` (USD, monthly)
- `price_pro_gbp_monthly` → `£79` (GBP, monthly)

Notes:

- The app chooses the correct Stripe **Price ID** based on region (and billing interval).
- Do not attempt to “compute” GBP from USD or vice versa.

## 3) Required Metadata on Stripe Price

Every Stripe **Price** must include the following metadata keys:

- `plan`: `"starter" | "pro" | "elite"`
- `region`: `"US" | "UK"`
- `billing`: `"monthly"`

This enables deterministic mapping and auditing without relying on display names.

## 4) Naming Conventions

Use this naming convention for Stripe **Price** identifiers (internal name / lookup key / alias you maintain in config):

`price_{plan}_{currency}_{interval}`

Examples:

- `price_starter_usd_monthly`
- `price_starter_gbp_monthly`
- `price_pro_usd_monthly`
- `price_pro_gbp_monthly`
- `price_elite_usd_monthly`
- `price_elite_gbp_monthly`

## 5) Explicit Warning (do not convert currency in-app)

- **NEVER convert currency in the app.**
- The app must select the correct **Stripe Price ID** based on user region and billing interval.
- Region detection decides which currency/region is shown and which Stripe Price ID is used.

