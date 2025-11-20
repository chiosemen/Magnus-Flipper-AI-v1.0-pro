# 🚀 Magnus Flipper AI - Deployment Instructions

## Quick Deploy to Vercel (Web App)

### Prerequisites
```bash
npm install -g vercel
```

### Deploy Web App
```bash
cd /Users/chinyeosemene/Developer/Magnus-Flipper-AI-v1.0-pro/web
vercel --prod
```

Follow prompts:
1. Link to existing project or create new one
2. Framework: Next.js detected automatically
3. Build command: `pnpm build` (auto-detected)
4. Output directory: `.next` (auto-detected)

### Expected Output
```
✅ Production: https://magnus-flipper-ai-[random].vercel.app
```

### Share This Link
Send the Vercel URL to friends for testing!

---

## Alternative: Vercel CLI Login First

```bash
vercel login
cd web
vercel --prod
```

---

## Mobile App Sharing

### Quick Test with Expo Go
```bash
cd /Users/chinyeosemene/Developer/Magnus-Flipper-AI-v1.0-pro/mobile
npx expo start --tunnel
```

Share the QR code - friends can scan with Expo Go app.

### Production Build
```bash
./scripts/build-mobile-shareable.sh
```

This creates shareable APK/IPA via EAS Build.

---

## Verify Deployment

Once deployed, test these routes:
- `/` - Dashboard home
- `/sniper/create` - Sniper creation page

All routes should load without errors.
