# 🚀 Magnus Flipper AI - Quick Deploy Commands

**Last Updated**: November 20, 2025
**Repository**: `/Users/chinyeosemene/Developer/Magnus-Flipper-AI-v1.0-pro`

---

## ⚡ ONE-COMMAND DEPLOYMENTS

### Deploy Web App to Vercel

```bash
cd /Users/chinyeosemene/Developer/Magnus-Flipper-AI-v1.0-pro && ./scripts/vercel-deploy-prod.sh
```

### Share Mobile App (Instant)

```bash
cd /Users/chinyeosemene/Developer/Magnus-Flipper-AI-v1.0-pro/mobile && npx expo start --tunnel
```

### Start All Workers Locally

```bash
cd /Users/chinyeosemene/Developer/Magnus-Flipper-AI-v1.0-pro && pm2 start ecosystem.config.js
```

---

## 📦 COMPLETE SETUP (First Time)

Run these commands in order:

```bash
# 1. Navigate to repository
cd /Users/chinyeosemene/Developer/Magnus-Flipper-AI-v1.0-pro

# 2. Install dependencies
pnpm install

# 3. Run stability check
./scripts/magnus_stability_god_v5.sh

# 4. Configure environment
cp .env.production.template .env.production
# Edit .env.production with your values
nano .env.production

# 5. Sync environment across apps
./scripts/env-sync.sh

# 6. Deploy web
./scripts/vercel-deploy-prod.sh

# 7. Start infrastructure (optional, for local workers)
docker-compose up -d

# 8. Start workers (optional)
pm2 start ecosystem.config.js
```

---

## 🔧 VERCEL ENVIRONMENT SETUP

### After First Deployment

```bash
# Set environment variables in Vercel
cd /Users/chinyeosemene/Developer/Magnus-Flipper-AI-v1.0-pro/web

# Method 1: Interactive
vercel env add NEXT_PUBLIC_API_URL production
# Enter: https://api.magnus-flipper.com

vercel env add NEXT_PUBLIC_SUPABASE_URL production
# Enter: https://your-project.supabase.co

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
# Enter: your_anon_key_here

# Method 2: One-liner (replace values)
echo "https://api.magnus-flipper.com" | vercel env add NEXT_PUBLIC_API_URL production && \
echo "https://your-project.supabase.co" | vercel env add NEXT_PUBLIC_SUPABASE_URL production && \
echo "your_anon_key_here" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production

# Redeploy after setting variables
vercel --prod
```

---

## 📱 MOBILE DEPLOYMENT OPTIONS

### Option A: Expo Go (No Build, Instant Share)

```bash
cd /Users/chinyeosemene/Developer/Magnus-Flipper-AI-v1.0-pro/mobile
npx expo start --tunnel

# Share the QR code that appears
# Friends scan with Expo Go app
```

### Option B: EAS Build (Production APK/IPA)

```bash
cd /Users/chinyeosemene/Developer/Magnus-Flipper-AI-v1.0-pro/mobile

# Login to Expo
eas login

# Build Android APK
eas build --platform android --profile shareable --non-interactive

# Build iOS (requires Apple Developer account)
eas build --platform ios --profile shareable --non-interactive

# Check build status
eas build:list
```

### Option C: Automated Script

```bash
cd /Users/chinyeosemene/Developer/Magnus-Flipper-AI-v1.0-pro
./scripts/build-mobile-shareable.sh
```

---

## 🔄 MAINTENANCE COMMANDS

### Update Dependencies

```bash
cd /Users/chinyeosemene/Developer/Magnus-Flipper-AI-v1.0-pro
pnpm update
pnpm turbo run build
```

### Rebuild Everything

```bash
cd /Users/chinyeosemene/Developer/Magnus-Flipper-AI-v1.0-pro

# Clean caches
rm -rf .turbo web/.next mobile/.expo node_modules */node_modules

# Reinstall
pnpm install

# Build
pnpm turbo run build
```

### Fix Mobile Dependencies

```bash
cd /Users/chinyeosemene/Developer/Magnus-Flipper-AI-v1.0-pro
./scripts/mobile-fix-and-build.sh
```

### Restart Workers

```bash
# View status
pm2 status

# Restart all
pm2 restart all

# Restart specific worker
pm2 restart scheduler

# View logs
pm2 logs

# Stop all
pm2 stop all

# Delete all and restart
pm2 delete all
pm2 start ecosystem.config.js
```

---

## 🧪 TESTING COMMANDS

### Test Web Build Locally

```bash
cd /Users/chinyeosemene/Developer/Magnus-Flipper-AI-v1.0-pro/web
pnpm build
pnpm start
# Open http://localhost:3000
```

### Test API Locally

```bash
cd /Users/chinyeosemene/Developer/Magnus-Flipper-AI-v1.0-pro/packages/api
pnpm run build
pnpm start
# API runs on http://localhost:4000
```

### Test Mobile Locally

```bash
cd /Users/chinyeosemene/Developer/Magnus-Flipper-AI-v1.0-pro/mobile
npx expo start
# Press 'i' for iOS simulator
# Press 'a' for Android emulator
# Press 'w' for web
```

---

## 📊 MONITORING COMMANDS

### Check All Services

```bash
# PM2 processes
pm2 status

# Docker containers
docker ps

# Vercel deployments
vercel list

# EAS builds
eas build:list
```

### View Logs

```bash
# PM2 logs
pm2 logs
pm2 logs scheduler --lines 100

# Docker logs
docker-compose logs -f redis
docker-compose logs -f postgres

# Vercel logs
vercel logs [deployment-url]
```

---

## 🆘 EMERGENCY FIXES

### Web App Won't Build

```bash
cd /Users/chinyeosemene/Developer/Magnus-Flipper-AI-v1.0-pro/web
rm -rf .next node_modules
pnpm install
pnpm build
```

### Mobile App Crashes

```bash
cd /Users/chinyeosemene/Developer/Magnus-Flipper-AI-v1.0-pro/mobile
rm -rf .expo node_modules
pnpm install
env EXPO_NO_INTERACTIVE=1 npx expo install --fix
npx expo start --clear
```

### Workers Won't Start

```bash
# Stop everything
pm2 stop all
docker-compose down

# Restart infrastructure
docker-compose up -d

# Restart workers
pm2 start ecosystem.config.js
```

### Git Issues

```bash
cd /Users/chinyeosemene/Developer/Magnus-Flipper-AI-v1.0-pro

# Stash local changes
git stash

# Pull latest
git pull origin main

# Apply stashed changes
git stash pop
```

---

## 🎯 QUICK REFERENCE

| Task | Command |
|------|---------|
| Deploy web | `./scripts/vercel-deploy-prod.sh` |
| Share mobile | `cd mobile && npx expo start --tunnel` |
| Start workers | `pm2 start ecosystem.config.js` |
| Check stability | `./scripts/magnus_stability_god_v5.sh` |
| Sync env | `./scripts/env-sync.sh` |
| PM2 status | `pm2 status` |
| Docker status | `docker ps` |
| View logs | `pm2 logs` |

---

## 📞 SHARE WITH FRIENDS

After deployment, share these:

### Web App
```
🌐 Magnus Flipper Web Dashboard
https://magnus-flipper-ai-[your-id].vercel.app

Try it out and let me know what you think!
```

### Mobile App (Expo Go)
```
📱 Magnus Flipper Mobile App

1. Install "Expo Go" app (iOS/Android)
2. Scan this QR code:
[QR code from npx expo start --tunnel]

Or open this link:
exp://[your-tunnel-url]
```

### Mobile App (EAS Build)
```
📱 Magnus Flipper Mobile App (Production Build)

Download APK:
https://expo.dev/accounts/[your-account]/projects/magnus-flipper-ai/builds/[build-id]

Or scan QR code:
[QR code from EAS dashboard]
```

---

**All commands tested and production-ready!** ✅
