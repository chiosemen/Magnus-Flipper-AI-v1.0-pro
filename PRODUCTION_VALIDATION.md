# Production Validation Report - Magnus Flipper AI

**Date:** 2025-11-22
**Environment:** Production (Render + Vercel)

---

## 🎯 Configuration Summary

### Render (Backend API)
- **Service Name:** `magnus-flipper-api`
- **URL:** `https://magnus-flipper-api.onrender.com`
- **Port:** 3001 (internal)
- **Region:** Frankfurt
- **Services Deployed:**
  - ✅ magnus-flipper-api (HTTP API)
  - ✅ magnus-scheduler (Worker)
  - ✅ magnus-worker-crawler (Worker)
  - ✅ magnus-worker-analyzer (Worker)
  - ✅ magnus-worker-alerts (Worker)
  - ✅ magnus-telegram-bot (Worker)
  - ✅ magnus-flipper-redis (Key-Value Store)

### Vercel (Frontend)
- **Framework:** Next.js
- **Build Directory:** `web/.next`
- **Required Environment Variables:**
  ```
  NEXT_PUBLIC_API_URL = https://magnus-flipper-api.onrender.com
  NEXT_PUBLIC_SOCKET_URL = https://magnus-flipper-api.onrender.com
  NEXT_PUBLIC_SUPABASE_URL
  NEXT_PUBLIC_SUPABASE_ANON_KEY
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  SUPABASE_URL
  SUPABASE_ANON_KEY
  STRIPE_SECRET_KEY
  ```

---

## ✅ Validation Checklist

### 1. Vercel Environment Variables

**Critical Check:** Verify these environment variables are set in Vercel Dashboard:

Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

| Variable | Expected Value | Status |
|----------|---------------|--------|
| `NEXT_PUBLIC_API_URL` | `https://magnus-flipper-api.onrender.com` | ⚠️ **VERIFY** |
| `NEXT_PUBLIC_SOCKET_URL` | `https://magnus-flipper-api.onrender.com` | ⚠️ **VERIFY** |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://[project].supabase.co` | ⚠️ **VERIFY** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGc...` (JWT token) | ⚠️ **VERIFY** |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` or `pk_test_...` | ⚠️ **VERIFY** |
| `SUPABASE_URL` | Same as NEXT_PUBLIC_SUPABASE_URL | ⚠️ **VERIFY** |
| `SUPABASE_ANON_KEY` | Same as NEXT_PUBLIC_SUPABASE_ANON_KEY | ⚠️ **VERIFY** |
| `STRIPE_SECRET_KEY` | `sk_live_...` or `sk_test_...` | ⚠️ **VERIFY** |

**Action Required:**
```bash
# View current Vercel env vars (requires vercel CLI)
cd web
vercel env ls

# Add missing variables via CLI
vercel env add NEXT_PUBLIC_API_URL production
# Enter: https://magnus-flipper-api.onrender.com

# Or add via dashboard:
# https://vercel.com/[your-team]/[your-project]/settings/environment-variables
```

### 2. Render API Status

**API Endpoint Structure:**
- Root: `https://magnus-flipper-api.onrender.com/`
- Health: `https://magnus-flipper-api.onrender.com/health`
- Deals: `https://magnus-flipper-api.onrender.com/api/deals`
- Alerts: `https://magnus-flipper-api.onrender.com/api/alerts`

**Note:** Render services may return "Access denied" to simple curl requests due to DDoS protection. This is NORMAL.

**Validation Methods:**

#### Method A: Browser Test
1. Open browser
2. Navigate to: `https://magnus-flipper-api.onrender.com/health`
3. Expected response: `{"status":"ok"}` or similar

#### Method B: Test from Frontend
The frontend app should be able to access the API. Check browser DevTools → Network tab.

#### Method C: Using User-Agent Header
```bash
curl -H "User-Agent: Mozilla/5.0" https://magnus-flipper-api.onrender.com/health
```

### 3. Frontend API Integration

**File:** `web/src/hooks/useDeals.ts` (line 6)
```typescript
const sdk = new MagnusSDK({ baseURL: process.env.NEXT_PUBLIC_API_URL });
```

**File:** `packages/sdk/src/client.ts` (line 13)
```typescript
this.axios = axios.create({
  baseURL: opts.baseURL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000",
  headers: opts.apiKey ? { Authorization: `Bearer ${opts.apiKey}` } : {}
});
```

**Expected Behavior:**
1. Frontend reads `NEXT_PUBLIC_API_URL` from environment
2. SDK uses this URL as baseURL
3. API calls are made to `https://magnus-flipper-api.onrender.com/api/deals`

**Browser DevTools Check:**
```javascript
// Open browser console on your deployed site
// Run this to check API URL:
console.log(process.env.NEXT_PUBLIC_API_URL);
// Expected: "https://magnus-flipper-api.onrender.com"
```

### 4. Test Deals Fetching

#### From Browser Console (on deployed site):
```javascript
// Check if API URL is set
console.log(process.env.NEXT_PUBLIC_API_URL);

// Test fetch manually
fetch('https://magnus-flipper-api.onrender.com/api/deals')
  .then(r => r.json())
  .then(d => console.log('Deals:', d))
  .catch(e => console.error('Error:', e));
```

#### Expected Response:
```json
{
  "deals": [
    {
      "id": "...",
      "title": "...",
      "score": 85,
      "created_at": "..."
    }
  ]
}
```

#### Common Issues:
- **CORS Error:** Check Render API has `cors()` middleware enabled (✅ verified in server.ts:42)
- **404 Error:** API URL mismatch - verify env var
- **Network Error:** API service down - check Render dashboard

### 5. Render Service Health

**Check Render Dashboard:**
1. Go to: https://dashboard.render.com
2. Verify services are "Live" (green status):
   - magnus-flipper-api
   - magnus-scheduler
   - magnus-worker-crawler
   - magnus-worker-analyzer
   - magnus-worker-alerts
   - magnus-telegram-bot
   - magnus-flipper-redis

**Check Logs:**
```bash
# Via Render dashboard
# Click service → Logs tab
# Look for:
# "🚀 API listening on http://localhost:3001"
# "Environment: production"
# "Health check: http://localhost:3001/health"
```

### 6. Database Connectivity

**Render API → Supabase Connection**

Required Env Vars on Render API service:
```
SUPABASE_URL=https://[project].supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE=eyJhbGc...
```

**Test Query:**
The `/api/deals` endpoint queries Supabase (see packages/api/src/routes/deals.ts:41-51).

If deals endpoint returns empty array `{"deals":[]}`, this means:
- ✅ API is working
- ✅ Database connection is working
- ⚠️ No deals in database (needs seeding)

If deals endpoint returns error, check:
- Database credentials in Render dashboard
- Supabase project is active
- Tables exist (run migrations)

---

## 🧪 Complete Test Script

Run this from your local machine or in browser console:

```javascript
// Test Suite for Production API
const API_URL = 'https://magnus-flipper-api.onrender.com';

async function testAPI() {
  console.log('🧪 Testing Magnus Flipper API...\n');

  // Test 1: Root endpoint
  try {
    const rootRes = await fetch(API_URL);
    const rootData = await rootRes.json();
    console.log('✅ Root endpoint:', rootData);
  } catch (err) {
    console.error('❌ Root endpoint failed:', err.message);
  }

  // Test 2: Health check
  try {
    const healthRes = await fetch(`${API_URL}/health`);
    const healthData = await healthRes.json();
    console.log('✅ Health check:', healthData);
  } catch (err) {
    console.error('❌ Health check failed:', err.message);
  }

  // Test 3: Deals endpoint
  try {
    const dealsRes = await fetch(`${API_URL}/api/deals`);
    const dealsData = await dealsRes.json();
    console.log('✅ Deals endpoint:', dealsData);
    console.log(`   Found ${dealsData.deals?.length || 0} deals`);
  } catch (err) {
    console.error('❌ Deals endpoint failed:', err.message);
  }

  // Test 4: V1 API endpoint
  try {
    const v1Res = await fetch(`${API_URL}/api/v1/deals`);
    const v1Data = await v1Res.json();
    console.log('✅ V1 API endpoint:', v1Data);
  } catch (err) {
    console.error('❌ V1 API failed:', err.message);
  }

  console.log('\n🏁 Tests complete');
}

testAPI();
```

---

## 🚀 Production Stability Checklist

### Pre-Production ✅
- [x] API deployed to Render
- [x] All workers deployed
- [x] Redis instance provisioned
- [ ] **Vercel env vars configured**
- [ ] Frontend deployed to Vercel
- [ ] Database migrations applied
- [ ] Database seeded with initial data

### Production Validation
- [ ] **API health endpoint returns 200**
- [ ] **Deals endpoint returns data or empty array (not error)**
- [ ] **Frontend can fetch deals successfully**
- [ ] **Browser console shows no CORS errors**
- [ ] **Browser Network tab shows successful API calls**
- [ ] Rate limiting is working (Redis connected)
- [ ] Error tracking configured (Sentry/logging)

### Monitoring
- [ ] Render logs showing API requests
- [ ] No 500 errors in logs
- [ ] Database queries succeeding
- [ ] Worker services running (check Render dashboard)
- [ ] Redis connection healthy

### Performance
- [ ] API response time < 500ms
- [ ] Frontend loads in < 3s
- [ ] No memory leaks (check Render metrics)
- [ ] No timeout errors

### Security
- [ ] CORS configured correctly (line 42 in packages/api/src/server.ts)
- [ ] Helmet security headers enabled (line 25-39 in packages/api/src/server.ts)
- [ ] Rate limiting active (line 61 in packages/api/src/server.ts)
- [ ] Environment secrets not exposed in frontend
- [ ] HTTPS enforced on all endpoints

---

## 🔧 Troubleshooting

### Issue: "Access denied" from curl

**Cause:** Render's DDoS protection blocking simple requests
**Solution:** Use browser or add User-Agent header:
```bash
curl -H "User-Agent: Mozilla/5.0" https://magnus-flipper-api.onrender.com/health
```

### Issue: Frontend shows "localhost:4000" in API calls

**Cause:** `NEXT_PUBLIC_API_URL` not set in Vercel
**Solution:**
1. Go to Vercel dashboard
2. Settings → Environment Variables
3. Add: `NEXT_PUBLIC_API_URL` = `https://magnus-flipper-api.onrender.com`
4. Redeploy frontend

### Issue: CORS errors in browser

**Cause:** API CORS not configured for frontend domain
**Solution:** Update `packages/api/src/server.ts:42`
```typescript
app.use(cors({
  origin: [
    'https://your-vercel-domain.vercel.app',
    'https://flipperagents.com'
  ],
  credentials: true
}));
```

### Issue: 503 errors from /api/deals

**Cause:** Database not configured
**Solution:** Check Render env vars:
```
SUPABASE_URL
SUPABASE_SERVICE_ROLE
```

### Issue: Empty deals array

**Cause:** No data in database
**Solution:** Seed database:
```bash
cd packages/api
pnpm seed --count=100
```

---

## 📊 Success Criteria

✅ **Production is ready when:**

1. Render API health check returns 200 OK
2. Vercel env var `NEXT_PUBLIC_API_URL` points to Render
3. Frontend can fetch deals without errors
4. Browser DevTools shows successful API calls
5. No CORS errors in console
6. All Render services show "Live" status
7. Database queries return data or empty array (not errors)
8. Response times < 500ms

---

## 📞 Quick Commands

```bash
# Check Vercel deployment
cd web
vercel ls

# Check Vercel env vars
vercel env ls

# Add env var
vercel env add NEXT_PUBLIC_API_URL production

# Redeploy frontend
vercel --prod

# Check what API URL the frontend will use
grep -r "NEXT_PUBLIC_API_URL" web/
```

---

**Status:** ⚠️ **VALIDATION REQUIRED**

**Next Steps:**
1. Confirm Vercel environment variables are set correctly
2. Test API endpoints from browser
3. Verify frontend can fetch deals
4. Complete checklist above

