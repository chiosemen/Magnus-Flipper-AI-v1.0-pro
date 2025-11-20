# Magnus Flipper AI - Mobile App (React Native + Expo)

**Status:** Production-Ready Mobile Application
**Platform:** iOS & Android (Cross-platform)
**Framework:** Expo SDK 52 + Expo Router v4
**Deployment:** Echo (EAS Build + Submit)

---

## 📱 App Overview

Magnus Flipper Mobile brings the complete arbitrage intelligence platform to your pocket:
- **Real-time deal feed** with AI scoring
- **Push notifications** for high-value alerts
- **Watchlist management** on the go
- **In-app Pro upgrade** via Stripe
- **Offline-first architecture** with AsyncStorage
- **Native performance** optimized for mobile networks

---

## 🏗️ Architecture

### Tech Stack
- **UI Framework:** React Native 0.75.3
- **Navigation:** Expo Router v4 (file-based routing)
- **Styling:** NativeWind (Tailwind CSS for React Native)
- **State Management:** Zustand + React Query
- **Auth:** Supabase Auth (JWT + Magic Links)
- **API Client:** Axios with interceptors
- **Payments:** Stripe React Native SDK
- **Push Notifications:** Expo Notifications + FCM/APNS
- **Analytics:** Sentry Mobile + Expo Analytics
- **Offline Storage:** AsyncStorage + React Query cache
- **Build System:** EAS Build (Echo hosted)

---

## 📂 Project Structure

```
/mobile
├── app/                           # Expo Router pages
│   ├── (auth)/
│   │   ├── login.tsx             # Login screen
│   │   ├── signup.tsx            # Signup screen
│   │   └── _layout.tsx           # Auth layout
│   ├── (tabs)/
│   │   ├── index.tsx             # Deals feed (home)
│   │   ├── watchlists.tsx        # Watchlists management
│   │   ├── alerts.tsx            # Alerts history
│   │   ├── profile.tsx           # Profile & settings
│   │   └── _layout.tsx           # Tab layout
│   ├── deal/[id].tsx             # Deal detail screen
│   ├── watchlist/[id].tsx        # Watchlist detail
│   ├── billing.tsx               # Stripe upgrade flow
│   ├── _layout.tsx               # Root layout
│   └── +not-found.tsx            # 404 screen
│
├── components/                    # Reusable UI components
│   ├── DealCard.tsx              # Deal list item
│   ├── WatchlistForm.tsx         # Create/edit watchlist
│   ├── AlertItem.tsx             # Alert notification item
│   ├── ROIStats.tsx              # Performance dashboard
│   ├── UpgradePrompt.tsx         # Pro tier CTA
│   ├── EmptyState.tsx            # No data placeholder
│   └── ui/                       # Base UI components
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Card.tsx
│       └── Badge.tsx
│
├── lib/                           # Core utilities
│   ├── api.ts                    # Axios instance + API client
│   ├── auth.ts                   # Supabase auth helper
│   ├── store.ts                  # Zustand global state
│   ├── notifications.ts          # Push notification setup
│   ├── analytics.ts              # Event tracking
│   └── utils.ts                  # Common helpers
│
├── hooks/                         # Custom React hooks
│   ├── useDeals.ts               # React Query: deals
│   ├── useWatchlists.ts          # React Query: watchlists
│   ├── useAlerts.ts              # React Query: alerts
│   ├── useAuth.ts                # Auth state + actions
│   └── useStripe.ts              # Payment flow
│
├── constants/                     # App-wide constants
│   ├── Colors.ts                 # Theme colors
│   ├── Layout.ts                 # Spacing, fonts
│   └── Config.ts                 # Feature flags
│
├── .env.example                  # Environment template
├── app.json                      # Expo configuration
├── eas.json                      # EAS Build profiles
├── tailwind.config.js            # NativeWind setup
├── tsconfig.json                 # TypeScript config
├── babel.config.js               # Babel transforms
├── package.json                  # Dependencies
└── README_MOBILE.md              # Setup & deployment guide
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Expo CLI (`npm install -g expo-cli`)
- EAS CLI (`npm install -g eas-cli`)
- Xcode (for iOS) or Android Studio (for Android)

### 1. Install Dependencies

```bash
cd mobile
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```bash
# API
EXPO_PUBLIC_API_URL=https://api.magnus-flipper.ai/v1

# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Stripe
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx

# Push Notifications
EXPO_PUBLIC_PUSH_ENDPOINT=https://api.magnus-flipper.ai/v1/alerts/push

# Analytics
EXPO_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx

# Feature Flags
EXPO_PUBLIC_ENABLE_STRIPE=true
EXPO_PUBLIC_ENABLE_PUSH=true
```

### 3. Start Development Server

```bash
npm run start
```

Options:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app

---

## 📱 Screen Flows

### Authentication Flow

```
┌─────────────┐
│  Splash     │
│  Screen     │
└──────┬──────┘
       │
       ▼
┌─────────────┐      ┌──────────────┐
│   Login     │◄────►│   Signup     │
│   Screen    │      │   Screen     │
└──────┬──────┘      └──────────────┘
       │
       │ (JWT stored)
       │
       ▼
┌─────────────┐
│  Main App   │
│  (Tabs)     │
└─────────────┘
```

**Login Methods:**
1. **Email + Password** (Supabase Auth)
2. **Magic Link** (passwordless)
3. **OAuth** (Google, Apple - optional)

**Features:**
- Auto-login if JWT valid
- Biometric unlock (Face ID / Touch ID)
- Remember me checkbox
- Forgot password flow

---

### Main App Navigation

```
┌──────────────────────────────────────┐
│          Tab Navigation               │
├──────┬──────┬──────┬──────┬──────────┤
│Deals │Watch │Alerts│      │ Profile  │
│ Feed │lists │      │      │          │
└──┬───┴──┬───┴──┬───┴──────┴────┬─────┘
   │      │      │                │
   │      │      │                │
   ▼      ▼      ▼                ▼
┌─────┐┌─────┐┌─────┐         ┌────────┐
│Deal ││Watch││Alert│         │Billing │
│Det. ││Det. ││Det. │         │Screen  │
└─────┘└─────┘└─────┘         └────────┘
```

---

### Deals Feed Screen (`/app/(tabs)/index.tsx`)

**Layout:**
```
┌────────────────────────────────┐
│  Magnus Flipper AI   [Profile] │ ← Header
├────────────────────────────────┤
│  [Filters: All▼  Score▼]       │ ← Filter bar
├────────────────────────────────┤
│  ┌──────────────────────────┐  │
│  │ 🔥 MacBook Pro 14        │  │ ← Deal Card
│  │ $1,699 • Score: 94       │  │
│  │ eBay • 2h ago            │  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │ Nike Dunk Low            │  │
│  │ $95 • Score: 89          │  │
│  │ FB Marketplace • 1h ago  │  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │ PS5 Digital              │  │
│  │ $380 • Score: 92         │  │
│  │ Craigslist • 30min ago   │  │
│  └──────────────────────────┘  │
├────────────────────────────────┤
│  [Load More...]                │ ← Pagination
└────────────────────────────────┘
```

**Features:**
- **Pull to refresh** - Latest deals
- **Infinite scroll** - Lazy loading
- **Score badges** - Color-coded (90+: gold, 80-89: silver, 70-79: bronze)
- **Quick actions** - Swipe to save, share, or hide
- **Offline mode** - Show cached deals with indicator

---

### Watchlists Screen (`/app/(tabs)/watchlists.tsx`)

**Layout:**
```
┌────────────────────────────────┐
│  My Watchlists      [+ Create] │
├────────────────────────────────┤
│  ┌──────────────────────────┐  │
│  │ 📱 Gaming Consoles        │  │
│  │ 8 active alerts           │  │
│  │ $200-$400 • 3 keywords   │  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │ 👟 Sneakers Under $150    │  │
│  │ 12 active alerts          │  │
│  │ $50-$150 • 5 keywords    │  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │ 💻 Apple Products         │  │
│  │ 4 active alerts           │  │
│  │ No price limit • 2 kw    │  │
│  └──────────────────────────┘  │
└────────────────────────────────┘
```

**Create Watchlist Flow:**
1. Tap **[+ Create]**
2. Enter name (required)
3. Add keywords (comma-separated)
4. Set price range (optional)
5. Choose notification channel (email/SMS/push)
6. Save → API POST /v1/watchlists

**Edit/Delete:**
- Swipe left → Delete
- Tap card → Edit modal
- Changes sync instantly via React Query

---

### Alerts Screen (`/app/(tabs)/alerts.tsx`)

**Layout:**
```
┌────────────────────────────────┐
│  Recent Alerts      [Mark Read]│
├────────────────────────────────┤
│  ┌──────────────────────────┐  │
│  │ 🔔 NEW                   │  │ ← Unread badge
│  │ MacBook Pro 14 match!    │  │
│  │ Score: 94 • $1,699       │  │
│  │ 2 minutes ago            │  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │ ✓ Read                   │  │
│  │ PS5 Digital match        │  │
│  │ Score: 92 • $380         │  │
│  │ 1 hour ago               │  │
│  └──────────────────────────┘  │
└────────────────────────────────┘
```

**Features:**
- **Push notification handler** - Tap notification → Opens deal
- **Mark as read** - Batch or individual
- **Filter by status** - Unread, Read, Archived
- **Quick actions** - Share alert, Open deal, Delete

---

### Profile Screen (`/app/(tabs)/profile.tsx`)

**Layout:**
```
┌────────────────────────────────┐
│  Profile                       │
├────────────────────────────────┤
│  ┌──────────────────────────┐  │
│  │  👤 John Doe              │  │
│  │  john@example.com         │  │
│  │  Free Plan                │  │
│  │  [Upgrade to Pro →]       │  │
│  └──────────────────────────┘  │
├────────────────────────────────┤
│  📊 Performance This Month     │
│  ┌──────────────────────────┐  │
│  │  Alerts Received: 45      │  │
│  │  Deals Purchased: 12      │  │
│  │  Avg Profit: $42          │  │
│  │  Total Profit: $504       │  │
│  └──────────────────────────┘  │
├────────────────────────────────┤
│  Settings                      │
│  ▸ Notifications               │
│  ▸ Account                     │
│  ▸ Billing                     │
│  ▸ Help & Support              │
│  ▸ Log Out                     │
└────────────────────────────────┘
```

**Performance Dashboard:**
- Real-time stats from `/v1/stats`
- Historical trends (chart)
- Leaderboard rank (if opted in)

---

### Billing Screen (`/app/billing.tsx`)

**Upgrade Flow:**

```
┌────────────────────────────────┐
│  Upgrade to Pro                │
├────────────────────────────────┤
│  ┌──────────────────────────┐  │
│  │ FREE           PRO        │  │
│  │ ────────────────────────  │  │
│  │ 10 alerts/mo   Unlimited  │  │
│  │ 2 watchlists   10 lists   │  │
│  │ Email only     Email+SMS  │  │
│  │                Priority   │  │
│  │ $0/mo         $29/mo      │  │
│  └──────────────────────────┘  │
│                                │
│  [Start Free Trial - 7 Days]   │  ← Stripe button
│                                │
│  ✓ Cancel anytime              │
│  ✓ No credit card for trial    │
└────────────────────────────────┘
```

**Payment Flow (Stripe):**
1. User taps **[Start Free Trial]**
2. Stripe sheet opens (native iOS/Android)
3. User enters card details
4. Stripe creates subscription
5. Backend receives webhook
6. User upgraded to Pro instantly
7. Redirect to success screen

**Implementation:**
```typescript
import { useStripe } from '@stripe/stripe-react-native';

const { initPaymentSheet, presentPaymentSheet } = useStripe();

await initPaymentSheet({
  merchantDisplayName: 'Magnus Flipper AI',
  customerId: user.stripeCustomerId,
  customerEphemeralKeySecret: ephemeralKey,
  paymentIntentClientSecret: clientSecret,
});

const { error } = await presentPaymentSheet();
```

---

## 🔔 Push Notifications

### Setup Flow

**1. Request Permissions (iOS/Android):**
```typescript
import * as Notifications from 'expo-notifications';

const { status } = await Notifications.requestPermissionsAsync();
if (status !== 'granted') {
  // Show fallback (email alerts only)
}
```

**2. Get Push Token:**
```typescript
const token = await Notifications.getExpoPushTokenAsync({
  projectId: 'your-expo-project-id'
});

// Send token to backend
await api.post('/v1/alerts/register-device', {
  token: token.data,
  platform: Platform.OS
});
```

**3. Handle Notifications:**
```typescript
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Listen for taps
Notifications.addNotificationResponseReceivedListener(response => {
  const dealId = response.notification.request.content.data.dealId;
  router.push(`/deal/${dealId}`);
});
```

---

### Notification Payload (from Backend)

```json
{
  "to": "ExponentPushToken[xxxxx]",
  "sound": "default",
  "title": "🔥 High Score Deal Alert!",
  "body": "MacBook Pro 14 - $1,699 (Score: 94)",
  "data": {
    "dealId": "550e8400-e29b-41d4-a716-446655440000",
    "score": 94,
    "action": "open_deal"
  },
  "badge": 1,
  "categoryId": "deal_alert"
}
```

**Notification Categories (iOS):**
- **deal_alert** - Quick actions: Open, Save, Dismiss
- **watchlist_match** - Actions: View Watchlist, Snooze
- **price_drop** - Actions: Buy Now, Share

---

## 💾 Offline Support

### AsyncStorage Cache Strategy

**What We Cache:**
1. **Recent deals** (last 50, updated every 5 min)
2. **User watchlists** (full list)
3. **Alert history** (last 100)
4. **User preferences** (settings)
5. **Auth token** (SecureStore for JWT)

**React Query Cache Config:**
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 30 * 60 * 1000, // 30 minutes
      retry: 3,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
  },
});
```

**Offline Indicator:**
```tsx
import NetInfo from '@react-native-community/netinfo';

const [isOnline, setIsOnline] = useState(true);

NetInfo.addEventListener(state => {
  setIsOnline(state.isConnected);
});

// Show banner if offline
{!isOnline && <OfflineBanner />}
```

---

## 🎨 UI/UX Design Principles

### Design System

**Colors (from constants/Colors.ts):**
```typescript
export const Colors = {
  primary: '#3B82F6',    // Blue
  success: '#10B981',    // Green (high score)
  warning: '#F59E0B',    // Orange (medium score)
  danger: '#EF4444',     // Red (low score)
  dark: '#111827',       // Background
  light: '#F3F4F6',      // Cards
  text: '#1F2937',       // Text
  textMuted: '#6B7280',  // Secondary text
};
```

**Typography:**
- **Headings:** SF Pro Display (iOS), Roboto (Android)
- **Body:** SF Pro Text / Roboto
- **Sizes:** 12, 14, 16, 18, 24, 32, 48

**Spacing:**
- Base unit: 4px
- Common: 8, 12, 16, 24, 32, 48

---

### Accessibility

- ✅ **VoiceOver/TalkBack** - All interactive elements labeled
- ✅ **Dynamic Type** - Text scales with user preferences
- ✅ **Color Contrast** - WCAG AA compliant
- ✅ **Touch Targets** - Minimum 44x44 points
- ✅ **Reduce Motion** - Respects system preference

---

## 📊 Analytics & Monitoring

### Events Tracked

```typescript
import { analytics } from '@/lib/analytics';

// User actions
analytics.track('deal_viewed', { dealId, score });
analytics.track('watchlist_created', { keywords, priceRange });
analytics.track('alert_opened', { alertId, channel });
analytics.track('upgrade_clicked', { plan: 'pro' });

// Performance
analytics.track('app_launch', { duration: loadTime });
analytics.track('api_error', { endpoint, statusCode });
```

### Sentry Error Tracking

```typescript
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  enableNative: true,
});

// Automatic error capture
try {
  await fetchDeals();
} catch (error) {
  Sentry.captureException(error);
  throw error;
}
```

---

## 🔐 Security

### Authentication

**JWT Storage:**
- Tokens stored in **Expo SecureStore** (encrypted)
- Auto-refresh before expiration
- Biometric unlock for quick access

**API Security:**
```typescript
// Axios interceptor adds auth header
axios.interceptors.request.use(config => {
  const token = await SecureStore.getItemAsync('jwt');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

**Network Security:**
- ✅ Certificate pinning (production)
- ✅ HTTPS only
- ✅ No sensitive data in logs

---

## 🚀 Deployment with Echo (EAS)

### EAS Build Configuration

**eas.json:**
```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "autoIncrement": true,
      "android": {
        "buildType": "app-bundle"
      },
      "ios": {
        "bundleIdentifier": "com.magnusflipper.mobile"
      }
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-play-service-account.json",
        "track": "internal"
      },
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "1234567890",
        "appleTeamId": "ABCD1234"
      }
    }
  }
}
```

---

### Build & Deploy Steps

**1. Link to Echo:**
```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Link project
eas init --id your-echo-project-id
```

**2. Configure Credentials:**
```bash
# iOS
eas credentials

# Android
# Upload google-play-service-account.json
```

**3. Build for Production:**
```bash
# Build both platforms
eas build --platform all --profile production

# Or individually
eas build --platform ios --profile production
eas build --platform android --profile production
```

**Build Output:**
- **iOS:** `.ipa` file ready for App Store Connect
- **Android:** `.aab` (App Bundle) for Play Console

**4. Submit to Stores:**
```bash
# iOS
eas submit -p ios --latest

# Android
eas submit -p android --latest
```

---

### CI/CD Integration

**GitHub Actions Workflow (`.github/workflows/mobile-deploy.yml`):**

```yaml
name: Mobile Deploy

on:
  push:
    branches: [main]
    paths:
      - 'mobile/**'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 20

      - name: Setup EAS
        uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Install dependencies
        run: cd mobile && npm ci

      - name: Build on EAS
        run: cd mobile && eas build --platform all --profile production --non-interactive

      - name: Submit to stores
        if: github.ref == 'refs/heads/main'
        run: cd mobile && eas submit --platform all --latest
```

---

### Release Timeline

**Week 1: Internal Testing**
- Build preview APK/IPA
- Distribute via TestFlight (iOS) / Internal Testing (Android)
- QA testing + bug fixes

**Week 2: Beta Testing**
- Public beta via TestFlight
- Invite 50-100 users
- Collect feedback

**Week 3: App Store Review**
- Submit to App Store Connect
- Submit to Google Play Console
- Respond to review questions

**Week 4: Public Launch**
- iOS: 2-3 day review (typical)
- Android: 1-2 day review (typical)
- Release to 100% of users

**Total: ~4 weeks** from first build to public availability.

---

## 📈 Success Metrics

**Engagement:**
- Daily Active Users (DAU)
- Session duration (target: 5+ minutes)
- Alerts opened (target: 30% open rate)
- Deals clicked (target: 15% click-through)

**Retention:**
- Day 1: 40%+
- Day 7: 25%+
- Day 30: 15%+

**Conversion:**
- Free → Pro: 10-15%
- Trial → Paid: 60%+
- Churn: <8%/month

**Performance:**
- App launch time: <2 seconds
- API response time: <500ms
- Crash rate: <0.1%

---

## 🎯 Post-Launch Roadmap

### Phase 2 (Month 2-3)
1. **Widget support** - Home screen deal widget
2. **Siri shortcuts** - "Hey Siri, show top deals"
3. **Apple Watch app** - Quick alerts on wrist
4. **Dark mode** - Automatic theme switching

### Phase 3 (Month 4-6)
5. **Social features** - Share flips, leaderboard
6. **AR preview** - View items in your space (iOS 14+)
7. **Barcode scanner** - Quick price lookup
8. **Offline maps** - Find nearby pickup locations

---

## 🆘 Troubleshooting

### Common Issues

**1. "Module not found" errors:**
```bash
cd mobile
rm -rf node_modules
npm install
npx expo start -c
```

**2. iOS build fails:**
```bash
cd ios
pod install
cd ..
eas build:configure
```

**3. Push notifications not working:**
- Check Expo project ID in `app.json`
- Verify FCM/APNS credentials in EAS
- Test with Expo Push Notification Tool

**4. Stripe payment sheet not opening:**
- Ensure `@stripe/stripe-react-native` installed
- Add URL scheme to `app.json`
- Test with Stripe test keys first

---

## 📞 Support

- **Documentation:** This file + [Expo Docs](https://docs.expo.dev)
- **API Reference:** https://api.magnus-flipper.ai/docs
- **Issues:** GitHub Issues
- **Discord:** Magnus Flipper Community

---

**App Status:** Production-Ready ✅
**Build System:** Echo (EAS) Configured ✅
**Store Submission:** Ready ✅
**Estimated Launch:** 4 weeks from deployment start

---

This mobile app brings the full power of Magnus Flipper AI to iOS and Android with native performance, offline support, and seamless monetization. Ready to ship! 🚀
