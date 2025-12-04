# Magnus Flipper AI - Web Dashboard

A comprehensive web dashboard for Magnus Flipper AI, built with Next.js, Supabase, and Stripe. This dashboard provides a full-featured SaaS platform for product flipping, AI valuations, and market insights.

## Features

### Core Features
- **Authentication**: Secure user authentication with Supabase
- **Product Management**: Add, edit, and track flipping products
- **AI Valuations**: Get instant AI-powered product valuations
- **Market Insights**: Real-time market trends and alerts
- **Subscription Management**: Stripe-powered SaaS subscriptions
- **Extensions Panel**: Modular AI-powered tools and integrations

### Subscription Tiers
1. **Free**: Up to 10 products, basic AI valuations
2. **Basic** ($9.99/mo): Up to 50 products, unlimited valuations, market insights
3. **Pro** ($29.99/mo): Unlimited products, advanced analytics, API access
4. **Enterprise** ($99.99/mo): Custom AI training, dedicated support, white-label

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Supabase Auth
- **Database**: Supabase (PostgreSQL)
- **Payments**: Stripe
- **State Management**: Zustand
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

## Project Structure

```
magnus-web-dashboard/
├── src/
│   ├── app/                      # Next.js App Router pages
│   │   ├── api/                  # API routes
│   │   │   ├── auth/            # Authentication endpoints
│   │   │   ├── stripe/          # Stripe webhooks & checkout
│   │   │   ├── products/        # Product CRUD operations
│   │   │   └── extensions/      # AI extensions & insights
│   │   ├── auth/                # Auth pages (login, signup)
│   │   ├── dashboard/           # Dashboard pages
│   │   │   ├── extensions/      # Extensions panel
│   │   │   ├── subscription/    # Subscription management
│   │   │   └── page.tsx         # Main dashboard
│   │   ├── layout.tsx           # Root layout
│   │   └── page.tsx             # Home page (redirects)
│   ├── components/              # React components
│   │   ├── ui/                  # Reusable UI components
│   │   ├── auth/                # Auth-specific components
│   │   ├── dashboard/           # Dashboard components
│   │   └── extensions/          # Extension components
│   ├── lib/                     # Utility libraries
│   │   ├── supabase/           # Supabase clients & middleware
│   │   └── stripe/             # Stripe configuration
│   ├── store/                   # Zustand state stores
│   ├── types/                   # TypeScript type definitions
│   └── utils/                   # Utility functions
├── public/                      # Static assets
├── .env.local                   # Environment variables (not in git)
├── .env.example                 # Example environment variables
└── package.json                 # Dependencies

```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- Stripe account
- (Optional) OpenAI API key for AI features
- (Optional) eBay API credentials for market data

### Installation

1. **Navigate to the project directory**:
   ```bash
   cd /Users/chinyeosemene/Developer/Magnus-Flipper-AI-v1.0-pro/magnus-web-dashboard
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:

   Copy `.env.example` to `.env.local` and fill in your credentials:
   ```bash
   cp .env.example .env.local
   ```

   Required variables:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   # Stripe
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
   STRIPE_PRICE_ID_BASIC=price_xxx
   STRIPE_PRICE_ID_PRO=price_xxx
   STRIPE_PRICE_ID_ENTERPRISE=price_xxx
   ```

4. **Set up Supabase database**:

   Run these SQL commands in your Supabase SQL editor:

   ```sql
   -- Users table (extends Supabase auth.users)
   CREATE TABLE public.profiles (
     id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
     full_name TEXT,
     avatar_url TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Subscriptions table
   CREATE TABLE public.subscriptions (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
     stripe_customer_id TEXT UNIQUE NOT NULL,
     stripe_subscription_id TEXT UNIQUE NOT NULL,
     tier TEXT NOT NULL DEFAULT 'free',
     status TEXT NOT NULL,
     current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
     current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
     cancel_at_period_end BOOLEAN DEFAULT FALSE,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Products table
   CREATE TABLE public.products (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
     title TEXT NOT NULL,
     description TEXT,
     category TEXT,
     brand TEXT,
     condition TEXT NOT NULL,
     purchase_price DECIMAL(10,2),
     target_sell_price DECIMAL(10,2),
     actual_sell_price DECIMAL(10,2),
     listing_url TEXT,
     images TEXT[] DEFAULT '{}',
     status TEXT NOT NULL DEFAULT 'draft',
     ai_valuation JSONB,
     market_insights JSONB,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     sold_at TIMESTAMP WITH TIME ZONE
   );

   -- Enable Row Level Security
   ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
   ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
   ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

   -- Profiles policies
   CREATE POLICY "Users can view own profile" ON public.profiles
     FOR SELECT USING (auth.uid() = id);
   CREATE POLICY "Users can update own profile" ON public.profiles
     FOR UPDATE USING (auth.uid() = id);

   -- Subscriptions policies
   CREATE POLICY "Users can view own subscription" ON public.subscriptions
     FOR SELECT USING (auth.uid() = user_id);

   -- Products policies
   CREATE POLICY "Users can view own products" ON public.products
     FOR SELECT USING (auth.uid() = user_id);
   CREATE POLICY "Users can insert own products" ON public.products
     FOR INSERT WITH CHECK (auth.uid() = user_id);
   CREATE POLICY "Users can update own products" ON public.products
     FOR UPDATE USING (auth.uid() = user_id);
   CREATE POLICY "Users can delete own products" ON public.products
     FOR DELETE USING (auth.uid() = user_id);
   ```

5. **Set up Stripe products and prices**:

   In your Stripe dashboard:
   - Create products for Basic, Pro, and Enterprise tiers
   - Create monthly recurring prices for each product
   - Copy the price IDs to your `.env.local` file
   - Set up a webhook endpoint pointing to `https://your-domain.com/api/stripe/webhook`
   - Add webhook events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`

6. **Run the development server**:
   ```bash
   npm run dev
   ```

7. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## API Routes

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `POST /api/auth/logout` - User logout

### Products
- `GET /api/products` - List user's products
- `POST /api/products` - Create new product
- `GET /api/products/[id]` - Get product details
- `PATCH /api/products/[id]` - Update product
- `DELETE /api/products/[id]` - Delete product

### Stripe
- `POST /api/stripe/create-checkout` - Create checkout session
- `POST /api/stripe/create-portal` - Open billing portal
- `POST /api/stripe/webhook` - Handle Stripe webhooks

### Extensions
- `POST /api/extensions/ai-valuation` - Get AI valuation
- `GET /api/extensions/market-insights` - Get market insights

## Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Adding New Features

1. **New API Route**: Add files to `src/app/api/[route]/route.ts`
2. **New Page**: Add files to `src/app/[route]/page.tsx`
3. **New Component**: Add files to `src/components/[category]/`
4. **New Type**: Update `src/types/index.ts`
5. **New Store**: Add files to `src/store/`

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Other Platforms

1. Build the application:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

## Integration with Mobile App

This dashboard shares API endpoints with the mobile app. The unified API layer in `src/app/api/` can be used by both web and mobile clients.

### Mobile API Access

Mobile apps can authenticate using Supabase and access the same API endpoints:

```typescript
// Mobile app example
const response = await fetch('https://your-domain.com/api/products', {
  headers: {
    'Authorization': `Bearer ${supabaseSession.access_token}`,
  },
});
```

## Customization

### Branding
- Update colors in `tailwind.config.ts`
- Replace logo in `public/` directory
- Update metadata in `src/app/layout.tsx`

### Subscription Tiers
- Modify tiers in `src/lib/stripe/server.ts`
- Update pricing display in `src/app/dashboard/subscription/page.tsx`

### Extensions
- Add new extensions to `src/app/dashboard/extensions/page.tsx`
- Create corresponding API routes in `src/app/api/extensions/`

## Security Considerations

- All API routes are protected with Supabase authentication
- Row Level Security (RLS) is enabled on all database tables
- Stripe webhooks are verified using webhook signatures
- Environment variables are used for all sensitive data
- HTTPS is required for production deployments

## Troubleshooting

### Authentication Issues
- Verify Supabase credentials in `.env.local`
- Check Supabase auth settings (email confirmation, etc.)
- Clear browser cookies and try again

### Stripe Issues
- Verify Stripe keys are correct (test vs. live mode)
- Check webhook endpoint is accessible
- Verify webhook secret matches Stripe dashboard

### Database Issues
- Ensure RLS policies are set up correctly
- Check Supabase service role key for admin operations
- Verify table permissions

## Support

For issues or questions:
- Check the documentation in this README
- Review the code comments
- Contact support at support@magnusflipperai.com

## License

Proprietary - Magnus Flipper AI

---

Built with ❤️ using Next.js, Supabase, and Stripe
