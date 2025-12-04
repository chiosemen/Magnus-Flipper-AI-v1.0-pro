# 🚀 Magnus Flipper AI Mobile - Quick Start

## ⚡ 5-Minute Setup

```bash
# 1. Install EAS CLI (if not already installed)
npm install -g eas-cli

# 2. Login
eas login

# 3. Navigate to mobile app
cd apps/mobile

# 4. Link to EAS project
eas init

# 5. Configure secrets (interactive)
./scripts/setup-eas-secrets.sh

# 6. Build and test
pnpm run eas:build:dev:android
```

---

## 📋 Minimal Secrets

```bash
eas secret:create --scope project --name EXPO_PUBLIC_PROJECT_ID --value "your-expo-project-id"
eas secret:create --scope project --name EXPO_PUBLIC_OWNER --value "your-expo-username"
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://your-project.supabase.co"
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your-anon-key"
eas secret:create --scope project --name EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY --value "pk_test_..."
```

---

## 🎯 Common Commands

```bash
# Development
pnpm dev                           # Start dev server
pnpm run eas:build:dev:android     # Build dev client

# Preview
pnpm run eas:build:preview         # Build preview (both platforms)

# Production
pnpm run eas:build:prod            # Build production
pnpm run eas:submit:prod           # Submit to stores

# OTA Updates
pnpm run eas:update:prod           # Push update to production

# Monitoring
eas build:list                     # List all builds
eas secret:list                    # List all secrets
```

---

## 📚 Full Documentation

| Document | What It Covers |
|----------|----------------|
| **README_MOBILE_DEPLOYMENT.md** | Complete overview and workflow |
| **EAS_SECRETS_MATRIX.md** | All 25+ environment variables |
| **EAS_BUILD_CHECKLIST.md** | Step-by-step deployment guide |
| **EAS_READY.md** | Executive summary and verification |
| **BUILD_READY.md** | Build repair details |

---

## 🔥 Fastest Path to Production

```bash
# From the monorepo root:
cd apps/mobile

# Setup (one-time)
npm install -g eas-cli && eas login && eas init
./scripts/setup-eas-secrets.sh

# Build for stores
pnpm run eas:build:prod

# Submit (after configuring store credentials in eas.json)
pnpm run eas:submit:prod

# Done! ✅
```

---

## ⚠️ Prerequisites

- [ ] Node.js 20+
- [ ] pnpm 9+
- [ ] Expo account (https://expo.dev)
- [ ] Apple Developer account (for iOS)
- [ ] Google Play Console account (for Android)

---

## 🆘 Need Help?

1. **Secrets not working?** → Check `eas secret:list`
2. **Build failing?** → See [EAS_BUILD_CHECKLIST.md](./EAS_BUILD_CHECKLIST.md) troubleshooting
3. **Environment variables?** → See [EAS_SECRETS_MATRIX.md](./EAS_SECRETS_MATRIX.md)
4. **Complete guide?** → See [README_MOBILE_DEPLOYMENT.md](./README_MOBILE_DEPLOYMENT.md)

---

**Status:** ✅ 100% Ready for EAS Deployment

All configuration files are complete. No placeholders. No mock data. Real backend integration.
