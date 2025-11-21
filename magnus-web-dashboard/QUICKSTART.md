# Magnus Flipper AI - Quick Start Guide

Get your Magnus Flipper AI web dashboard up and running in minutes!

## Prerequisites Checklist

- [ ] Node.js 18+ installed
- [ ] npm or yarn installed
- [ ] Supabase account created
- [ ] Stripe account created

## 5-Minute Setup

### 1. Install Dependencies (1 min)

```bash
cd /Users/chinyeosemene/Developer/Magnus-Flipper-AI-v1.0-pro/magnus-web-dashboard
npm install
```

### 2. Configure Environment Variables (2 min)

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your credentials:

```env
# Supabase (get from https://app.supabase.com)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Stripe (get from https://dashboard.stripe.com)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

### 3. Set Up Database (1 min)

Go to your Supabase SQL Editor and run:

```sql
-- Copy the SQL from README.md section 4
-- This creates: profiles, subscriptions, and products tables
```

### 4. Start Development Server (1 min)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## First Login

1. Navigate to http://localhost:3000
2. You'll be redirected to `/auth/login`
3. Click "Sign up" to create an account
4. Enter your email and password
5. Check your email for confirmation (if enabled in Supabase)
6. Login and explore the dashboard!

## What You Get

### Pages
- `/auth/login` - Login page
- `/auth/signup` - Registration page
- `/dashboard` - Main dashboard with stats
- `/dashboard/products` - Product management (coming soon)
- `/dashboard/extensions` - AI extensions panel
- `/dashboard/subscription` - Subscription management
- `/dashboard/settings` - User settings (coming soon)

### API Endpoints
All API routes are available at `/api/*`:
- Auth: `/api/auth/login`, `/api/auth/signup`, `/api/auth/logout`
- Products: `/api/products`, `/api/products/[id]`
- Stripe: `/api/stripe/create-checkout`, `/api/stripe/create-portal`, `/api/stripe/webhook`
- Extensions: `/api/extensions/ai-valuation`, `/api/extensions/market-insights`

## Testing Subscriptions

### Test Mode (No real charges)

1. Use Stripe test keys (starting with `pk_test_` and `sk_test_`)
2. Use test card: `4242 4242 4242 4242`
3. Any future date for expiry
4. Any 3-digit CVC

### Test Subscription Flow

1. Go to `/dashboard/subscription`
2. Click "Subscribe" on any paid tier
3. Enter test card details
4. Complete checkout
5. Verify subscription updates in dashboard

## Next Steps

### For Development
1. Customize the UI components in `src/components/`
2. Add more API routes in `src/app/api/`
3. Implement AI features (OpenAI integration)
4. Add eBay API for market data
5. Build mobile app that uses same API

### For Production
1. Update environment variables to production values
2. Set up production Supabase project
3. Configure Stripe live mode
4. Deploy to Vercel or your preferred platform
5. Set up custom domain
6. Configure Stripe webhook to production URL

## Common Issues

### "Unauthorized" errors
- Check Supabase credentials in `.env.local`
- Verify you're logged in
- Clear cookies and try again

### Stripe checkout not working
- Verify you're using test mode keys
- Check webhook secret is correct
- Ensure Stripe products are created

### Build errors
- Run `npm install` again
- Delete `node_modules` and `.next` folders, then reinstall
- Check Node.js version (must be 18+)

## Architecture Overview

```
Client (Browser/Mobile)
    ↓
Next.js App (Web Dashboard)
    ↓
API Routes (/api/*)
    ↓
Supabase (Auth + Database) + Stripe (Payments)
```

## File Structure

```
src/
├── app/              # Pages and API routes
├── components/       # React components
├── lib/             # Third-party integrations
├── store/           # State management
└── types/           # TypeScript types
```

## Resources

- [Full README](./README.md) - Complete documentation
- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Stripe Docs](https://stripe.com/docs)

## Support

Need help? Check:
1. README.md for detailed docs
2. Code comments for implementation details
3. GitHub issues for common problems

---

Happy coding! 🚀
