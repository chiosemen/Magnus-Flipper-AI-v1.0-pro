# 🚀 Magnus Flipper AI - Complete Deployment Guide

**Repository**: `/Users/chinyeosemene/Developer/Magnus-Flipper-AI-v1.0-pro`
**Version**: 1.0.0
**Status**: 100% Production Ready

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Web Deployment (Vercel)](#web-deployment)
4. [Mobile App Sharing](#mobile-app-sharing)
5. [API & Workers Deployment](#api-workers-deployment)
6. [Verification & Testing](#verification)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Tools

```bash
# Install Vercel CLI
npm install -g vercel

# Install EAS CLI (for mobile builds)
npm install -g eas-cli

# Install PM2 (for workers)
npm install -g pm2

# Verify installations
vercel --version
eas --version
pm2 --version
```

### Required Accounts

- **Vercel Account**: https://vercel.com/signup
- **Expo Account**: https://expo.dev/signup (for EAS builds)
- **Supabase Project**: https://supabase.com (for database)
- **Stripe Account**: https://stripe.com (for payments, optional)

---

## Environment Setup

### Step 1: Configure Root Environment

```bash
cd /Users/chinyeosemene/Developer/Magnus-Flipper-AI-v1.0-pro

# Copy template
cp .env.production.template .env.production

# Edit with your values
nano .env.production
```

**Required Variables**:
```bash
# API
API_URL=https://api.magnus-flipper.com  # Or your API URL

# Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_key
SUPABASE_ANON_KEY=your_anon_key

# Redis
REDIS_URL=redis://localhost:6379  # Or production Redis URL

# Notifications
TELEGRAM_BOT_TOKEN=your_bot_token  # Optional
```

### Step 2: Sync Environment Variables

```bash
./scripts/env-sync.sh
```

This automatically creates:
- `web/.env.production`
- `mobile/.env.production`

---

## Web Deployment

### Option A: Automated Deployment (Recommended)

```bash
# Run the complete deployment script
./scripts/vercel-deploy-prod.sh
```

This script will:
1. Check Vercel CLI installation
2. Verify authentication
3. Build the Next.js app
4. Deploy to production
5. Provide the production URL

### Option B: Manual Deployment

```bash
cd web

# Login to Vercel
vercel login

# Link project (first time only)
vercel link

# Deploy to production
vercel --prod
```

### Step 3: Set Environment Variables in Vercel

**Option 1 - Via Dashboard**:
1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add these variables for **Production**:

```
NEXT_PUBLIC_API_URL=https://api.magnus-flipper.com
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

**Option 2 - Via CLI**:

```bash
# Run helper script
./scripts/prepare-vercel-secrets.sh

# Or manually
cd web
echo "https://api.magnus-flipper.com" | vercel env add NEXT_PUBLIC_API_URL production
echo "https://your-project.supabase.co" | vercel env add NEXT_PUBLIC_SUPABASE_URL production
echo "your_anon_key" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
```

### Step 4: Redeploy After Setting Variables

```bash
cd web
vercel --prod
```

### ✅ Expected Result

```
✅ Production: https://magnus-flipper-ai-[project-id].vercel.app

📋 Share this link with friends!
```

---

## Mobile App Sharing

### Option A: Quick Share (Expo Go - No Build)

**Best for**: Instant testing with friends

```bash
cd /Users/chinyeosemene/Developer/Magnus-Flipper-AI-v1.0-pro/mobile

# Start with tunnel (publicly accessible)
npx expo start --tunnel
```

**Result**: QR code appears in terminal

**Share with friends**:
1. Friends install **Expo Go** app (iOS/Android)
2. Scan the QR code
3. App loads instantly

### Option B: Production Build (EAS Build)

**Best for**: Professional distribution

```bash
cd mobile

# Login to Expo
eas login

# Build for Android (APK)
eas build --platform android --profile shareable

# Build for iOS (requires Apple Developer account)
eas build --platform ios --profile shareable
```

**Result**: EAS provides:
- Download link for APK
- QR code for easy sharing
- TestFlight link (iOS, if configured)

### Option C: Automated Build Script

```bash
# Run the automated script
./scripts/build-mobile-shareable.sh
```

---

## API & Workers Deployment

### Option A: Local Deployment (PM2)

```bash
cd /Users/chinyeosemene/Developer/Magnus-Flipper-AI-v1.0-pro

# Start infrastructure
docker-compose up -d

# Start all workers and API
pm2 start ecosystem.config.js

# Check status
pm2 status

# View logs
pm2 logs

# Save configuration
pm2 save

# Auto-start on boot
pm2 startup
```

### Option B: Deploy API to Render

1. **Create Render Account**: https://render.com

2. **Create Web Service**:
   - Repository: Your GitHub repo
   - Branch: `main`
   - Root Directory: `packages/api`
   - Build Command: `pnpm install && pnpm run build`
   - Start Command: `node dist/server.js`

3. **Set Environment Variables** in Render dashboard:
   ```
   NODE_ENV=production
   PORT=4000
   REDIS_URL=your_redis_url
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_KEY=your_service_key
   ```

4. **Deploy Workers** (separate services):
   - Scheduler: `node apps/scheduler/src/index.js`
   - Worker Crawler: `node apps/worker-crawler/src/index.js`
   - Worker Analyzer: `node apps/worker-analyzer/src/index.js`
   - Worker Alerts: `node apps/worker-alerts/src/index.js`

---

## Verification & Testing

### Web App Verification

```bash
# Test production URL
curl https://your-app.vercel.app

# Expected: HTML response with no errors
```

**Test in browser**:
- [ ] Homepage loads
- [ ] Navigation works
- [ ] No console errors
- [ ] All assets load

### Mobile App Verification

**With Expo Go**:
- [ ] QR code scans successfully
- [ ] App launches
- [ ] Navigation works
- [ ] No fatal errors

**With EAS Build**:
- [ ] APK downloads
- [ ] Installs on Android device
- [ ] App launches and functions

### API Verification

```bash
# Test API health
curl https://your-api-url/health

# Expected: {"status": "ok"}
```

### Workers Verification

```bash
# Check PM2 status
pm2 status

# Expected: All processes "online"

# Check logs
pm2 logs --lines 50

# Expected: No errors, job processing messages
```

---

## Troubleshooting

### Web Deployment Issues

**Issue**: "Environment Variable references Secret that does not exist"

**Solution**:
1. Remove secret references from `web/vercel.json` ✅ (already fixed)
2. Set environment variables in Vercel dashboard
3. Redeploy

**Issue**: Build fails

**Solution**:
```bash
cd web
rm -rf .next node_modules
pnpm install
pnpm build
```

### Mobile Issues

**Issue**: "Expo doctor fails"

**Solution**:
```bash
cd mobile
./scripts/mobile-fix-and-build.sh
```

**Issue**: "Dependencies outdated"

**Solution**:
```bash
cd mobile
env EXPO_NO_INTERACTIVE=1 npx expo install --fix
```

### Workers Not Starting

**Issue**: Redis connection failed

**Solution**:
```bash
# Start Redis via Docker
docker-compose up -d redis

# Or check Redis URL
echo $REDIS_URL
```

**Issue**: PM2 process crashes

**Solution**:
```bash
# Check logs
pm2 logs [process-name]

# Restart
pm2 restart [process-name]

# Reset PM2
pm2 delete all
pm2 start ecosystem.config.js
```

---

## Production URLs

After deployment, you'll have:

### Web Dashboard
```
https://magnus-flipper-ai-[project-id].vercel.app
```

### Mobile App
- **Expo Go**: Scan QR code from `npx expo start --tunnel`
- **EAS Build**: Download link from `eas build:list`

### API (if deployed to Render)
```
https://magnus-flipper-api.onrender.com
```

---

## Next Steps

### Immediate (Share with Friends)
1. ✅ Deploy web to Vercel
2. ✅ Share Expo tunnel QR code
3. ✅ Collect feedback

### Short Term (Week 1)
1. Configure production database (Supabase)
2. Set up Stripe for payments
3. Deploy workers to production
4. Set up monitoring (Sentry, New Relic)

### Medium Term (Month 1)
1. Custom domain for web app
2. App Store submission (iOS)
3. Play Store submission (Android)
4. CI/CD pipeline setup
5. Automated testing

---

## Support & Resources

### Documentation
- **Production Checklist**: `PRODUCTION_CHECKLIST.md`
- **Release Notes**: `RELEASE_NOTES_FOR_TESTERS.md`
- **Deploy Instructions**: `DEPLOY_INSTRUCTIONS.md`

### Scripts
- **Stability Check**: `./scripts/magnus_stability_god_v5.sh`
- **Environment Sync**: `./scripts/env-sync.sh`
- **Vercel Deploy**: `./scripts/vercel-deploy-prod.sh`
- **Mobile Fix**: `./scripts/mobile-fix-and-build.sh`

### Quick Commands

```bash
# Full health check
./scripts/magnus_stability_god_v5.sh

# Deploy web
./scripts/vercel-deploy-prod.sh

# Share mobile
cd mobile && npx expo start --tunnel

# Start workers
pm2 start ecosystem.config.js

# Check everything
pm2 status && docker ps && vercel whoami
```

---

## 🎉 Success Criteria

Your deployment is successful when:

- ✅ Web app loads at Vercel URL
- ✅ Mobile app runs via Expo Go
- ✅ API responds to health checks
- ✅ Workers process jobs
- ✅ Friends can access and test

---

**Congratulations! Your Magnus Flipper AI is now live!** 🚀
