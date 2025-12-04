# VERCEL DEPLOYMENT PLAN

**Last Updated**: 2024-01-15  
**Project**: Magnus Flipper AI Web Application

---

## PROJECT CONFIGURATION

### Build Settings

- **Framework Preset**: Next.js
- **Build Command**: `pnpm --filter web build`
- **Output Directory**: `.next`
- **Install Command**: `pnpm install`
- **Node.js Version**: `20.x` (recommended) or `18.x`

### Root Directory

- **Root Directory**: `apps/web`

**Note**: If deploying from monorepo root, configure root directory in Vercel project settings.

---

## ENVIRONMENT VARIABLES

### Required Variables

See `DEPLOYMENT_ENV_MATRIX.md` for complete list.

**Critical Variables**:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY` (LIVE for production)
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_APP_URL`
- `NODE_ENV=production`

### Environment-Specific Variables

Configure separately for:
- **Production**: Use LIVE Stripe keys
- **Preview**: Use TEST Stripe keys
- **Development**: Use TEST Stripe keys

---

## BUILD CONFIGURATION

### Build Command

```bash
pnpm --filter web build
```

### Install Command

```bash
pnpm install
```

### Output Directory

```
.next
```

### Node.js Version

Set in Vercel project settings:
- **Recommended**: `20.x`
- **Alternative**: `18.x`

---

## EDGE RUNTIME MAPPINGS

### API Routes Using Edge Runtime

Configure in `next.config.js`:

```javascript
module.exports = {
  // ... other config
  experimental: {
    // Edge runtime for specific routes
  },
}
```

### Routes That Should Use Edge Runtime

- `/api/health` - Health check (can use Edge)
- `/api/stripe/webhook` - Webhook handler (Node.js runtime required for longer processing)

**Note**: Most API routes use Node.js runtime by default. Edge runtime is optional for simple routes.

---

## ROUTES & REWRITES

### Protected Routes

Routes that require authentication:
- `/dashboard/*` - User dashboard
- `/admin/*` - Admin panel
- `/settings/*` - User settings
- `/api/admin/*` - Admin API endpoints
- `/api/profit/*` - Profit analytics (requires auth)
- `/api/shipping/*` - Shipping management (requires auth)

### Public Routes

- `/` - Landing page
- `/login` - Login page
- `/signup` - Signup page
- `/pricing` - Pricing page
- `/api/health` - Health check
- `/api/stripe/webhook` - Stripe webhook (public endpoint, verified by signature)

### Redirects

Configure in `vercel.json` (if needed):

```json
{
  "redirects": [
    {
      "source": "/home",
      "destination": "/dashboard",
      "permanent": true
    }
  ]
}
```

### Rewrites

Not required for standard Next.js App Router setup.

---

## VERCEL.JSON CONFIGURATION

Create `apps/web/vercel.json`:

```json
{
  "buildCommand": "pnpm --filter web build",
  "devCommand": "pnpm --filter web dev",
  "installCommand": "pnpm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ],
  "rewrites": [],
  "redirects": []
}
```

**Note**: Most configuration can be done via Vercel dashboard. This file is optional.

---

## PROTECTED ROUTES POLICY

### Authentication Middleware

Next.js middleware handles authentication. Configure in `apps/web/src/middleware.ts`:

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Authentication checks
  // Redirect to login if not authenticated
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/settings/:path*',
    '/api/admin/:path*',
    '/api/profit/:path*',
    '/api/shipping/:path*',
  ],
};
```

### Authorization

- **User Routes**: Require valid session
- **Admin Routes**: Require admin tier subscription
- **API Routes**: Verify authentication in route handlers

---

## DEPLOYMENT WORKFLOW

### Automatic Deployments

1. **Production**: Deploy on push to `main` branch
2. **Preview**: Deploy on pull requests
3. **Development**: Manual deployment from `develop` branch

### Manual Deployment

1. Connect GitHub repository to Vercel
2. Configure build settings
3. Set environment variables
4. Deploy

### Deployment Steps

1. **Pre-deployment**:
   - Verify all environment variables set
   - Run build locally: `pnpm --filter web build`
   - Test locally: `pnpm --filter web start`

2. **Deployment**:
   - Push to `main` branch (triggers automatic deployment)
   - Or deploy manually from Vercel dashboard

3. **Post-deployment**:
   - Verify deployment at production URL
   - Check health endpoint: `https://[domain]/api/health`
   - Test critical user flows
   - Monitor error logs

---

## PERFORMANCE OPTIMIZATION

### Next.js Optimizations

- **Image Optimization**: Enabled by default
- **Static Generation**: Use for public pages
- **ISR**: Use for dynamic content with revalidation
- **Edge Caching**: Configured via Vercel

### Build Optimizations

- **Turbopack**: Enabled in Next.js 14+
- **Tree Shaking**: Automatic with pnpm
- **Code Splitting**: Automatic with Next.js

---

## MONITORING & LOGS

### Vercel Logs

- Access via Vercel dashboard
- Real-time logs during deployment
- Function logs for API routes
- Edge logs for Edge functions

### Error Tracking

Configure external service (e.g., Sentry):
- Add Sentry SDK to Next.js app
- Configure DSN in environment variables
- Set up error alerts

---

## CUSTOM DOMAIN

### Domain Configuration

1. Add custom domain in Vercel project settings
2. Configure DNS records:
   - **A Record**: Point to Vercel IP
   - **CNAME**: Point to Vercel domain
3. SSL certificate automatically provisioned

### Environment Variable Update

Update `NEXT_PUBLIC_APP_URL` to match custom domain.

---

## TROUBLESHOOTING

### Common Issues

1. **Build Failures**:
   - Check Node.js version
   - Verify build command
   - Check for TypeScript errors

2. **Environment Variable Issues**:
   - Verify all required variables set
   - Check variable names (case-sensitive)
   - Ensure no trailing spaces

3. **API Route Errors**:
   - Check function logs in Vercel dashboard
   - Verify runtime (Node.js vs Edge)
   - Check timeout settings

4. **Import Errors**:
   - Ensure packages built before web app
   - Verify workspace protocol in package.json

---

## ROLLBACK PROCEDURE

### Automatic Rollback

Vercel keeps previous deployments. To rollback:

1. Go to Vercel dashboard
2. Select project
3. Go to Deployments
4. Find previous successful deployment
5. Click "Promote to Production"

### Manual Rollback

1. Revert code changes in Git
2. Push to `main` branch
3. New deployment will use previous code

---

## NEXT STEPS

1. ✅ Create Vercel project
2. ✅ Connect GitHub repository
3. ✅ Configure build settings
4. ✅ Set environment variables
5. ✅ Deploy to preview
6. ✅ Test preview deployment
7. ✅ Deploy to production

---

**END OF VERCEL DEPLOYMENT PLAN**

