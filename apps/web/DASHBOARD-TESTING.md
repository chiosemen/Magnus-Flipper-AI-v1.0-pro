# Dashboard Testing Instructions

## 🚨 CRITICAL: Workspace Root Issue Fixed

The dashboard wasn't rendering because Next.js was mis-detecting the monorepo root.
This has been fixed in `next.config.js`.

---

## ✅ Quick Test (2 Steps)

### Step 1: Start Dev Server (From Correct Location)

**Option A - Use the dev script (Recommended):**
```bash
cd apps/web
./dev-dashboard.sh
```

**Option B - Manual:**
```bash
cd apps/web
rm -rf .next
pnpm dev
```

**⚠️ DO NOT USE:** `pnpm --filter web dev` from repo root
(This causes the workspace root detection issue)

### Step 2: Visit Dashboard

Open in browser:
```
http://localhost:3000/dashboard
```

---

## 🎯 Visual Verification

### ✅ SUCCESS - You'll see:

1. **BRIGHT RED BANNER** at the very top:
   ```
   ✅ DASHBOARD PAGE IS RENDERING - apps/web/app/dashboard/page.tsx
   ```
   - This banner is PULSING
   - This banner is FIXED to the top
   - This banner is IMPOSSIBLE TO MISS

2. **Yellow warning banner** below it:
   ```
   ⚠️ DEVELOPMENT MODE ACTIVE
   All authentication checks DISABLED
   ```

3. **Dashboard content:**
   - Market Intelligence cards with animated counters
   - Live Intelligence Panel with pulsing indicators
   - Marketplace Heatmap with logos
   - Live Deal Feed
   - All with premium styling and animations

### ❌ FAILURE - If you see:

- Login page
- Homepage
- **NO red banner at top**

Then Next.js is STILL using wrong root. Check terminal for warnings.

---

## 🔍 Debug Checklist

If the dashboard still doesn't render:

1. **Check terminal output**
   - Look for: `Warning: Next.js inferred your workspace root`
   - If you see this → root detection still failing

2. **Verify you're in apps/web**
   ```bash
   pwd
   # Should output: /path/to/Magnus-Flipper-AI-v1.0-pro-reset/apps/web
   ```

3. **Kill all Next.js processes**
   ```bash
   pkill -f next
   ```

4. **Clear all Next.js caches**
   ```bash
   rm -rf apps/web/.next
   rm -rf .next
   ```

5. **Restart from apps/web**
   ```bash
   cd apps/web
   pnpm dev
   ```

---

## 🎨 What the Dashboard Shows

With `DISABLE_AUTH_GUARD=true` in `.env.local`, you'll see **demo data**:

- **Market Intelligence** - 4 animated metric cards with trends
- **Live Intelligence Panel** - Real-time signals with pulsing "LIVE" badge
- **Marketplace Heatmap** - Cards with marketplace logos, heat bars, velocity hints
- **Live Deal Feed** - Deal cards with NEW/HOT badges and marketplace logos
- **Active Intelligence Feeds** - Tracking parameters
- **Platform Status Monitor** - System health with marketplace logos

All with Framer Motion animations:
- Counters that count up on load
- Hover lift + glow effects
- Pulsing live indicators
- Animated heat bars
- Smooth transitions

---

## 🔒 To Re-enable Auth

Edit `apps/web/.env.local`:
```bash
# Set to false or comment out
DISABLE_AUTH_GUARD=false
NEXT_PUBLIC_DISABLE_AUTH_GUARD=false
```

Then restart the dev server.

---

## 📊 Environment Variables

Current `.env.local` should have:
```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder_key_for_build

DISABLE_AUTH_GUARD=true
NEXT_PUBLIC_DISABLE_AUTH_GUARD=true
```

---

## ✨ Summary

**Problem:** Next.js workspace root mis-detection prevented dashboard from mounting
**Solution:** Force Turbopack root in `next.config.js` + run from `apps/web`
**Verification:** Bright red pulsing banner at top of page

If you see the red banner, **everything is working!** 🎉
