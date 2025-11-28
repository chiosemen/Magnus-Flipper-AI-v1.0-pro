# Mobile Trial Onboarding Flow

This directory contains the mobile trial onboarding screens for Magnus Flipper AI.

## 📱 Screens

### 1. Start (`start.tsx`)
- **Route:** `/(auth)/trial/start`
- **Purpose:** Introduce trial offer and features
- **Features:**
  - List of premium features
  - Trial terms (14 days free)
  - Pricing information ($29/month after trial)
  - Call-to-action to start trial

### 2. Billing (`billing.tsx`)
- **Route:** `/(auth)/trial/billing`
- **Purpose:** Collect payment method via Stripe
- **Features:**
  - Stripe payment sheet integration
  - Security badge and trust indicators
  - Trial cost breakdown ($0 today)
  - Payment method collection (no charge)

### 3. Confirm (`confirm.tsx`)
- **Route:** `/(auth)/trial/confirm`
- **Purpose:** Verify trial setup and confirm activation
- **Features:**
  - Display trial details
  - Verify payment method added
  - Sync trial status with backend
  - Final confirmation before activation

### 4. Success (`success.tsx`)
- **Route:** `/(auth)/trial/success`
- **Purpose:** Celebrate trial activation
- **Features:**
  - Success animation
  - Trial benefits reminder
  - Next steps guidance
  - Auto-redirect to main app (5 seconds)

## 🔄 Flow Diagram

```
┌─────────────┐
│   Start     │ ──► User reviews features & pricing
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Billing   │ ──► User adds payment method (Stripe)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Confirm   │ ──► User verifies & activates trial
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Success   │ ──► Redirect to main app
└─────────────┘
```

## 🔌 API Integration

Each screen interacts with the backend API:

- **Start:** No API calls (informational only)
- **Billing:**
  - `POST /mobile/trial/start` - Create trial session
  - Returns SetupIntent for payment collection
- **Confirm:**
  - `POST /mobile/trial/confirm` - Activate trial
  - `POST /mobile/trial/sync` - Verify status
- **Success:** No API calls

## 🎨 Styling

All screens use:
- Tailwind CSS via NativeWind
- Dark theme (`bg-gray-900`)
- Consistent color palette (blue primary, green success)
- Ionicons for icons
- React Native Reanimated for animations (success screen)

## 🧪 Testing

### Manual Testing

1. Start Expo dev server: `pnpm dev`
2. Navigate to `/(auth)/trial/start`
3. Complete the flow with test card: `4242 4242 4242 4242`
4. Verify trial activation in Supabase

### Test Data

- **Test Card:** 4242 4242 4242 4242
- **Expiry:** Any future date
- **CVC:** Any 3 digits

## 🔒 Security

- Payment collection via Stripe (PCI compliant)
- SetupIntent used (no immediate charge)
- User must be authenticated
- RLS policies protect user data

## 📝 Environment Variables

Required in mobile `.env`:

```bash
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
EXPO_PUBLIC_SUPABASE_URL=https://...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
EXPO_PUBLIC_API_URL=https://...
```

## 🚀 Navigation

Users can access trial flow from:
- Login screen (link to trial)
- Signup screen (link to trial)
- Settings (if trial available)

Exit points:
- Back button (all screens except success)
- Success screen auto-redirect
- Manual navigation to main app

## 📚 Related Files

- `mobile/lib/api.ts` - API client with trial methods
- `mobile/lib/payments.ts` - Stripe payment helpers
- `apps/api/src/routes/mobileTrial.ts` - Backend endpoints
- `supabase/migrations/20251128_mobile_trial_support.sql` - Database schema

## 🐛 Troubleshooting

**Payment sheet doesn't appear:**
- Check Stripe publishable key in `.env`
- Verify Stripe initialization in app startup

**Trial not activated:**
- Check API logs for errors
- Verify network connection
- Check Supabase for trial record

**App crashes on navigation:**
- Ensure all dependencies installed
- Check for missing environment variables
