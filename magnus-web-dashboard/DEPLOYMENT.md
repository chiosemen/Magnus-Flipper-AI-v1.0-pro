# Deployment Guide - Magnus Flipper AI

Step-by-step guide to deploy your Magnus Flipper AI web dashboard to production.

## Pre-Deployment Checklist

### ✅ Supabase Setup
- [ ] Create production Supabase project
- [ ] Run database migrations (SQL from README.md)
- [ ] Enable Row Level Security on all tables
- [ ] Test RLS policies
- [ ] Configure email templates
- [ ] Set up email provider (if using email auth)
- [ ] Copy production credentials

### ✅ Stripe Setup
- [ ] Switch to Stripe live mode
- [ ] Create production products (Basic, Pro, Enterprise)
- [ ] Create monthly recurring prices
- [ ] Copy price IDs
- [ ] Set up webhook endpoint (will update after deployment)
- [ ] Configure webhook events
- [ ] Test in Stripe test mode first

### ✅ Code Preparation
- [ ] Test locally with production credentials
- [ ] Run `npm run build` successfully
- [ ] Fix any TypeScript errors
- [ ] Test all authentication flows
- [ ] Test subscription flows
- [ ] Update metadata in `src/app/layout.tsx`

## Vercel Deployment (Recommended)

### Step 1: Prepare Repository

```bash
cd /Users/chinyeosemene/Documents/magnus-web-dashboard

# Initialize git (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Magnus Flipper AI web dashboard"

# Create GitHub repository and push
git remote add origin https://github.com/yourusername/magnus-web-dashboard.git
git branch -M main
git push -u origin main
```

### Step 2: Import to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: ./
   - **Build Command**: `npm run build`
   - **Output Directory**: .next

### Step 3: Add Environment Variables

In Vercel project settings, add all environment variables:

```env
# Supabase (Production)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Stripe (Live Mode)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx (will update after webhook setup)

# Stripe Product IDs (Live Mode)
STRIPE_PRICE_ID_BASIC=price_xxxxx
STRIPE_PRICE_ID_PRO=price_xxxxx
STRIPE_PRICE_ID_ENTERPRISE=price_xxxxx

# App URLs
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NEXT_PUBLIC_API_URL=https://your-domain.vercel.app/api

# Optional: AI Features
OPENAI_API_KEY=sk-xxxxx
EBAY_APP_ID=xxxxx
EBAY_CERT_ID=xxxxx
EBAY_DEV_ID=xxxxx
```

### Step 4: Deploy

1. Click "Deploy"
2. Wait for build to complete
3. Note your deployment URL: `https://your-project.vercel.app`

### Step 5: Configure Stripe Webhook

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Enter URL: `https://your-project.vercel.app/api/stripe/webhook`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copy webhook signing secret
6. Update `STRIPE_WEBHOOK_SECRET` in Vercel
7. Redeploy if needed

### Step 6: Configure Custom Domain (Optional)

1. In Vercel project settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Update `NEXT_PUBLIC_APP_URL` to your custom domain
5. Update Stripe webhook URL to custom domain

## Alternative: Deploy to Other Platforms

### Netlify

```bash
# Build command
npm run build

# Publish directory
.next

# Environment variables
# Add same variables as Vercel
```

### Railway

```bash
# Railway will auto-detect Next.js
railway init
railway up
```

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t magnus-flipper-web .
docker run -p 3000:3000 --env-file .env.local magnus-flipper-web
```

## Post-Deployment Checklist

### ✅ Test Everything

- [ ] Visit production URL
- [ ] Test signup flow
- [ ] Test login flow
- [ ] Test logout
- [ ] Test dashboard access
- [ ] Test subscription flow (use test card first)
- [ ] Test Stripe webhook (check Stripe dashboard)
- [ ] Test AI extensions
- [ ] Test on mobile devices
- [ ] Test different browsers

### ✅ Configure Production Settings

- [ ] Set up error monitoring (Sentry, LogRocket, etc.)
- [ ] Configure analytics (Google Analytics, Plausible, etc.)
- [ ] Set up uptime monitoring
- [ ] Configure backup strategy
- [ ] Set up CI/CD pipeline
- [ ] Enable Vercel Analytics

### ✅ Security Check

- [ ] Verify all API routes require authentication
- [ ] Test RLS policies in Supabase
- [ ] Verify Stripe webhook signature validation
- [ ] Check HTTPS is enforced
- [ ] Review CORS settings
- [ ] Test rate limiting (if implemented)

### ✅ Performance Check

- [ ] Run Lighthouse audit
- [ ] Check page load times
- [ ] Verify images are optimized
- [ ] Test on slow networks
- [ ] Check Core Web Vitals

## Monitoring & Maintenance

### Regular Tasks

**Daily**
- Monitor error rates
- Check Stripe dashboard for failed payments
- Review user feedback

**Weekly**
- Check server logs
- Monitor API response times
- Review database performance
- Check storage usage

**Monthly**
- Update dependencies
- Review security alerts
- Backup database
- Review subscription metrics

### Monitoring Tools

**Vercel**
- Built-in analytics
- Deployment logs
- Function logs

**Supabase**
- Database logs
- API usage
- Auth logs

**Stripe**
- Subscription metrics
- Failed payment alerts
- Webhook logs

## Rollback Procedure

If something goes wrong:

1. **Vercel**: Revert to previous deployment
   - Go to Deployments
   - Find working version
   - Click "Promote to Production"

2. **Database**: Restore from backup
   - Go to Supabase Dashboard
   - Database → Backups
   - Restore selected backup

3. **Environment Variables**: Check history
   - Vercel keeps history of env var changes
   - Restore previous values if needed

## Troubleshooting

### Deployment Fails

**Build errors**
```bash
# Test locally first
npm run build

# Check Node version
node --version  # Should be 18+

# Clear cache
rm -rf .next node_modules
npm install
npm run build
```

**Environment variable issues**
- Verify all required variables are set
- Check for typos in variable names
- Ensure no trailing spaces

### Runtime Errors

**Authentication not working**
- Verify Supabase URL and keys
- Check Supabase auth settings
- Test with Supabase SQL Editor

**Stripe checkout fails**
- Verify live mode keys
- Check product/price IDs are correct
- Test webhook endpoint accessibility

**API errors**
- Check server logs in Vercel
- Verify database connection
- Test endpoints with Postman

## Scaling Considerations

### Database
- Monitor Supabase usage
- Set up read replicas if needed
- Consider connection pooling

### API
- Implement rate limiting
- Add caching layer (Redis)
- Use CDN for static assets

### Storage
- Use external storage (S3, Cloudinary) for images
- Implement image optimization
- Set up CDN

## Backup Strategy

### Automated Backups

**Supabase**
- Point-in-time recovery (built-in)
- Daily automated backups
- Manual backup before major changes

**Code**
- Git repository (GitHub)
- Multiple branches
- Tag releases

**Environment Variables**
- Document all variables
- Store securely (1Password, etc.)
- Keep backup copy

## Support Contacts

- **Vercel Support**: vercel.com/support
- **Supabase Support**: supabase.com/support
- **Stripe Support**: support.stripe.com

## Success Criteria

Deployment is successful when:
- ✅ Site loads at production URL
- ✅ Users can sign up and login
- ✅ Subscriptions work end-to-end
- ✅ Stripe webhooks process correctly
- ✅ All pages render without errors
- ✅ Mobile experience is smooth
- ✅ Performance metrics are good

---

Congratulations on deploying Magnus Flipper AI! 🎉
