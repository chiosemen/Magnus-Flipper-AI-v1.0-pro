# Magnus Flipper AI - Mobile App

React Native mobile application built with Expo for Magnus Flipper AI deal tracking platform.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- iOS Simulator (macOS) or Android Emulator
- Expo CLI: `npm install -g expo-cli eas-cli`

### Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Configure environment:**
```bash
cp .env.example .env
# Edit .env with your credentials
```

3. **Start development server:**
```bash
npm start
```

Press `i` for iOS or `a` for Android.

## 📦 Project Structure

```
mobile/
├── app/                    # Expo Router screens
│   ├── (auth)/            # Authentication screens
│   ├── (tabs)/            # Main app tabs
│   └── _layout.tsx        # Root layout
├── components/            # Reusable UI components
├── lib/                   # Core libraries
│   ├── api.ts            # API client with axios
│   ├── auth.ts           # Supabase authentication
│   ├── env.ts            # Environment configuration
│   ├── store.ts          # Zustand state management
│   └── notifications.ts  # Push notifications
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript types
├── app.json              # Expo configuration
├── eas.json              # EAS Build configuration
├── .env.example          # Environment template
└── expo-env.d.ts         # Type definitions
```

## 🔧 Environment Configuration

This project uses **dotenv-expand** for advanced environment variable management.

### Basic Usage

Create a `.env` file:
```bash
# API Configuration
EXPO_PUBLIC_API_URL=https://api.magnusflipper.ai/v1

# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Stripe
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
```

### Variable Expansion

**dotenv-expand** supports variable expansion for cleaner configuration:

```bash
# Base configuration
BASE_URL=https://api.magnusflipper.ai
API_VERSION=v1

# Expanded variables
EXPO_PUBLIC_API_URL=${BASE_URL}/${API_VERSION}
EXPO_PUBLIC_PUSH_ENDPOINT=${BASE_URL}/${API_VERSION}/alerts/push

# Conditional values
NODE_ENV=production
EXPO_PUBLIC_LOG_LEVEL=${NODE_ENV:+info}
```

### Environment Files

- `.env` - Main environment file (gitignored)
- `.env.example` - Template with all variables
- `.env.local` - Local overrides (gitignored)
- `.env.production` - Production values
- `.env.development` - Development values

### Type-Safe Configuration

All environment variables are type-checked via `expo-env.d.ts`:

```typescript
import { env } from '@/lib/env';

// Type-safe access
console.log(env.apiUrl);        // string
console.log(env.enableStripe);  // boolean
```

### Validation

Environment is validated on app startup:

```typescript
import { validateEnv, logEnvConfig } from '@/lib/env';

// Validate required variables
const { valid, errors } = validateEnv();

// Log configuration (dev only)
logEnvConfig();
```

## 📱 Available Scripts

```bash
# Development
npm start              # Start Expo dev server
npm run dev            # Start with cache clear
npm run ios            # Run iOS simulator
npm run android        # Run Android emulator

# Type checking
npm run type-check     # Run TypeScript checks
npm run lint           # Run ESLint

# Production builds
npm run build:android  # Build Android APK/AAB
npm run build:ios      # Build iOS IPA
npm run build:all      # Build both platforms
npm run build:preview  # Build preview version

# Store submission
npm run submit:android # Submit to Google Play
npm run submit:ios     # Submit to App Store
```

## 🏗️ Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | React Native 0.75.3 |
| Routing | Expo Router v4 |
| Styling | NativeWind (Tailwind) |
| State | Zustand + React Query |
| Auth | Supabase Auth |
| Storage | SecureStore + AsyncStorage |
| API | Axios + TypeScript |
| Payments | Stripe React Native |
| Push | Expo Notifications |
| Build | EAS Build |

## 🔐 Authentication

Using Supabase Auth with SecureStore for token persistence:

```typescript
import { auth } from '@/lib/auth';

// Sign up
await auth.signUp(email, password);

// Sign in
await auth.signIn(email, password);

// Sign out
await auth.signOut();

// Get current user
const user = await auth.getUser();
```

## 📡 API Integration

Type-safe API client with automatic auth token injection:

```typescript
import { api } from '@/lib/api';

// Fetch deals
const deals = await api.getDeals({ minScore: 80 });

// Create watchlist
const watchlist = await api.createWatchlist({
  name: 'Electronics',
  keywords: ['laptop', 'phone'],
  minPrice: 100,
  maxPrice: 1000,
});
```

## 🔔 Push Notifications

```typescript
import { notifications } from '@/lib/notifications';

// Register for push
const token = await notifications.registerForPushNotifications();

// Listen for notifications
notifications.addNotificationReceivedListener((notification) => {
  console.log('Received:', notification);
});

// Handle notification tap
notifications.addNotificationResponseReceivedListener((response) => {
  // Navigate to deal
  router.push(`/deals/${response.notification.data.dealId}`);
});
```

## 🗄️ State Management

Zustand store with AsyncStorage persistence:

```typescript
import { useStore } from '@/lib/store';

function DealsScreen() {
  const deals = useStore((state) => state.deals);
  const setDeals = useStore((state) => state.setDeals);

  // State is automatically persisted
  return <DealsList deals={deals} />;
}
```

## 🎨 Styling

NativeWind (Tailwind CSS) for consistent styling:

```tsx
<View className="flex-1 bg-gray-900 p-4">
  <Text className="text-white text-2xl font-bold">
    Deals
  </Text>
</View>
```

## 📦 Building for Production

### iOS

```bash
# Configure credentials
eas credentials

# Build
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios --latest
```

### Android

```bash
# Build AAB
eas build --platform android --profile production

# Submit to Play Store
eas submit --platform android --latest
```

## 🧪 Testing

```bash
# Run type checks
npm run type-check

# Lint code
npm run lint

# Test on physical device
npx expo start --tunnel
# Scan QR code with Expo Go app
```

## 🐛 Troubleshooting

### Environment Variables Not Loading

```bash
# Clear cache and restart
npm run dev
```

### Build Fails

```bash
# Reconfigure build
eas build:configure

# Clear EAS build cache
eas build --clear-cache
```

### Push Notifications Not Working

1. Verify `EXPO_PUBLIC_EXPO_PROJECT_ID` in `.env`
2. Check credentials: `eas credentials`
3. Test with: https://expo.dev/notifications

### Type Errors

```bash
# Regenerate types
npx expo customize tsconfig.json

# Check for errors
npm run type-check
```

## 📚 Documentation

- [Expo Router Docs](https://docs.expo.dev/router/introduction/)
- [Supabase JS SDK](https://supabase.com/docs/reference/javascript)
- [Stripe React Native](https://stripe.com/docs/payments/accept-a-payment?platform=react-native)
- [NativeWind](https://www.nativewind.dev/)
- [EAS Build](https://docs.expo.dev/build/introduction/)

## 📄 License

Private - Magnus Flipper AI

---

**Built with:** React Native + Expo + Supabase + Stripe
**Timeline:** 8-10 weeks to production
**Status:** Ready for development
