# Magnus Flipper Mobile - Quick Start Guide

## 🚀 60-Second Setup

### 1. Install Dependencies
```bash
cd mobile
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your credentials (Supabase, Stripe)
```

### 3. Start Development
```bash
npm run start
```

Press:
- **`i`** for iOS Simulator
- **`a`** for Android Emulator
- **Scan QR** with Expo Go app on physical device

---

## 📱 Key Commands

```bash
# Development
npm run start          # Start dev server
npm run ios            # Run iOS simulator
npm run android        # Run Android emulator

# Production Builds
npm run build:android  # Build Android APK/AAB
npm run build:ios      # Build iOS IPA
npm run build:preview  # Build preview for testing

# Store Submission
npm run submit:android # Submit to Google Play
npm run submit:ios     # Submit to App Store
```

---

## 🔑 Required Credentials

1. **Supabase** (get from https://supabase.com)
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`

2. **Stripe** (get from https://stripe.com/dashboard)
   - `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY`

3. **Expo Project** (run `eas init`)
   - `EXPO_PUBLIC_EXPO_PROJECT_ID`

4. **Sentry** (optional, get from https://sentry.io)
   - `EXPO_PUBLIC_SENTRY_DSN`

---

## 🏗️ Project Structure

```
mobile/
├── app/                    # Screens (Expo Router)
│   ├── (auth)/            # Login, Signup
│   ├── (tabs)/            # Main app tabs
│   └── _layout.tsx        # Root layout
├── components/            # Reusable UI
├── lib/                   # API, Auth, Store
├── hooks/                 # Custom React hooks
└── .env                   # Your credentials
```

---

## 🎯 Core Features

| Feature | Status | Location |
|---------|--------|----------|
| Authentication | ✅ Ready | `app/(auth)/` |
| Deals Feed | ✅ Ready | `app/(tabs)/index.tsx` |
| Watchlists | ✅ Ready | `app/(tabs)/watchlists.tsx` |
| Push Alerts | 🟡 Backend needed | `lib/notifications.ts` |
| Stripe Payments | 🟡 Keys required | `app/billing.tsx` |
| Offline Mode | ✅ Ready | `lib/store.ts` |

✅ = Works out of box
🟡 = Needs configuration
❌ = Not implemented

---

## 🚢 Deployment to Stores

### Prerequisites
```bash
npm install -g eas-cli
eas login
eas init
```

### iOS (Apple App Store)
```bash
# 1. Configure credentials
eas credentials

# 2. Build
eas build --platform ios --profile production

# 3. Submit
eas submit --platform ios --latest
```

**Timeline:** 2-3 day review

---

### Android (Google Play)
```bash
# 1. Build
eas build --platform android --profile production

# 2. Submit
eas submit --platform android --latest
```

**Timeline:** 1-2 day review

---

## 🐛 Troubleshooting

### "Module not found"
```bash
rm -rf node_modules
npm install
npx expo start -c
```

### "Build failed"
```bash
eas build:configure
# Then rebuild
```

### "Push notifications not working"
- Check Expo Project ID in `.env`
- Verify credentials in EAS dashboard
- Test with: https://expo.dev/notifications

---

## 📞 Need Help?

- **Full Documentation:** [MOBILE_APP_COMPLETE.md](./MOBILE_APP_COMPLETE.md)
- **API Docs:** https://api.magnus-flipper.ai/docs
- **Expo Docs:** https://docs.expo.dev
- **Support:** support@magnusflipper.ai

---

**Ready in:** ~10 minutes ⏱️
**Deploy in:** ~4 weeks 📱
**Tech Stack:** React Native + Expo + Supabase + Stripe
