# Vercel Production Environment Variables Sync Checklist

**Generated:** December 6, 2025  
**Purpose:** Ensure Vercel Production environment variables match `DEPLOYMENT_ENV_MATRIX.md` requirements

---

## 📋 Required Frontend Environment Variables (NEXT_PUBLIC_*)

### ✅ Already Configured (Assumed)
- `NEXT_PUBLIC_API_BASE_URL` - Already exists in Vercel

---

### 🔴 Required for Build & Runtime

| Variable Name | Required | Sample Format | Description |
|--------------|----------|---------------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | **YES** | `https://xxxxx.supabase.co` | Supabase project URL (public) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **YES** | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Supabase anonymous/public key (safe for client) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | **YES** | `pk_live_xxxxx` | Stripe publishable key for client-side Stripe.js |
| `NEXT_PUBLIC_APP_URL` | **YES** | `https://flipperagents.com` | Public application URL (for redirects, OAuth callbacks) |

---

### 🟡 Optional but Recommended

| Variable Name | Required | Sample Format | Description |
|--------------|----------|---------------|-------------|
| `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID` | No | `price_xxxxx` | Stripe Price ID for PRO tier (used in subscription metadata) |
| `NEXT_PUBLIC_STRIPE_AGENCY_PRICE_ID` | No | `price_xxxxx` | Stripe Price ID for AGENCY tier (used in subscription metadata) |

**Note:** If not set, the app will fall back to server-side `STRIPE_PRO_PRICE` and `STRIPE_AGENCY_PRICE` env vars.

---

## 🔒 Required Server-Side Environment Variables

These are needed for API routes and server-side operations (NOT exposed to client):

| Variable Name | Required | Sample Format | Description |
|--------------|----------|---------------|-------------|
| `SUPABASE_SERVICE_ROLE_KEY` | **YES** | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Supabase service role key (server-only, bypasses RLS) |
| `STRIPE_SECRET_KEY` | **YES** | `sk_live_xxxxx` | Stripe secret key for server-side operations |
| `STRIPE_WEBHOOK_SECRET` | **YES** | `whsec_xxxxx` | Stripe webhook signing secret |
| `STRIPE_PRO_PRICE` | **YES** | `price_xxxxx` | Stripe Price ID for PRO tier (server-side) |
| `STRIPE_AGENCY_PRICE` | **YES** | `price_xxxxx` | Stripe Price ID for AGENCY tier (server-side) |

**Security Note:** These are server-only variables. They are NOT prefixed with `NEXT_PUBLIC_` and will NOT be exposed to the client.

---

## 📝 Vercel CLI Commands

### Frontend Variables (NEXT_PUBLIC_*)

```bash
# Required: Supabase Configuration
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# Value: https://[YOUR_PROJECT_ID].supabase.co

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
# Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (from Supabase Dashboard → Settings → API → anon/public key)

# Required: Stripe Public Key
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production
# Value: pk_live_xxxxx (from Stripe Dashboard → Developers → API keys → Publishable key)

# Required: Application URL
vercel env add NEXT_PUBLIC_APP_URL production
# Value: https://flipperagents.com

# Optional: Stripe Price IDs (if you want them client-accessible)
vercel env add NEXT_PUBLIC_STRIPE_PRO_PRICE_ID production
# Value: price_xxxxx (from Stripe Dashboard → Products → Pro tier → Price ID)

vercel env add NEXT_PUBLIC_STRIPE_AGENCY_PRICE_ID production
# Value: price_xxxxx (from Stripe Dashboard → Products → Agency tier → Price ID)
```

### Server-Side Variables (NOT NEXT_PUBLIC_*)

```bash
# Required: Supabase Service Role Key (server-only)
vercel env add SUPABASE_SERVICE_ROLE_KEY production
# Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (from Supabase Dashboard → Settings → API → service_role key)
# ⚠️ HIGH SECURITY: Never expose to client

# Required: Stripe Secret Key (server-only)
vercel env add STRIPE_SECRET_KEY production
# Value: sk_live_xxxxx (from Stripe Dashboard → Developers → API keys → Secret key)
# ⚠️ HIGH SECURITY: Never expose to client

# Required: Stripe Webhook Secret
vercel env add STRIPE_WEBHOOK_SECRET production
# Value: whsec_xxxxx (from Stripe Dashboard → Developers → Webhooks → [Your webhook] → Signing secret)
# ⚠️ HIGH SECURITY: Never expose to client

# Required: Stripe Price IDs (server-side)
vercel env add STRIPE_PRO_PRICE production
# Value: price_xxxxx (from Stripe Dashboard → Products → Pro tier → Price ID)

vercel env add STRIPE_AGENCY_PRICE production
# Value: price_xxxxx (from Stripe Dashboard → Products → Agency tier → Price ID)
```

---

## ✅ Verification Checklist

After adding all variables, verify:

- [ ] All `NEXT_PUBLIC_*` variables are set (required for client-side code)
- [ ] All server-side variables are set (required for API routes)
- [ ] No placeholder values (e.g., "your-key-here", "placeholder")
- [ ] Stripe keys are LIVE keys (not TEST keys) for production
- [ ] Supabase keys match your production Supabase project
- [ ] `NEXT_PUBLIC_APP_URL` matches your actual domain (`https://flipperagents.com`)
- [ ] `NEXT_PUBLIC_API_BASE_URL` is already set (assumed existing)

---

## 🔍 Where to Find Values

### Supabase
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Settings → API
4. Copy:
   - **URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Keep secret!)

### Stripe
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Developers → API keys
3. Copy:
   - **Publishable key** → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - **Secret key** → `STRIPE_SECRET_KEY` (⚠️ Keep secret!)
4. Developers → Webhooks
5. Select your webhook endpoint → Copy **Signing secret** → `STRIPE_WEBHOOK_SECRET`
6. Products → Select tier → Copy **Price ID** → `STRIPE_PRO_PRICE` / `STRIPE_AGENCY_PRICE`

### Application URL
- Use your actual production domain: `https://flipperagents.com`

---

## 📊 Summary

**Total Required Variables:**
- **Frontend (NEXT_PUBLIC_*):** 4 required, 2 optional
- **Server-side:** 5 required

**Total Commands to Run:** 9 commands (4 frontend + 5 server-side)

---

## ⚠️ Important Notes

1. **DO NOT** run these commands automatically - values must be entered manually
2. **DO NOT** include real secrets in this document
3. **DO NOT** commit secrets to version control
4. All server-side variables are encrypted in Vercel
5. `NEXT_PUBLIC_*` variables are exposed to the client (safe for public keys)
6. Server-side variables are NOT exposed to the client (secure)

---

## 🚀 Next Steps

1. Review this checklist
2. Gather all required values from Supabase and Stripe dashboards
3. Run each `vercel env add` command manually, entering the actual values
4. Verify all variables are set: `vercel env ls production`
5. Trigger a new deployment: `vercel --prod`
6. Monitor deployment logs to ensure no missing variable errors

---

**END OF CHECKLIST**

