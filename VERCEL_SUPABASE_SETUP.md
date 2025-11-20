# 🚀 Connecting Supabase to Vercel - Complete Guide

**Your Supabase Project:** https://hfqhwdbdsvdbrorpnnbf.supabase.co

---

## 📋 Step-by-Step Setup

### **Step 1: Get Your Supabase Keys**

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `hfqhwdbdsvdbrorpnnbf`
3. Click **Settings** → **API**
4. Copy these two keys:

```bash
# Project URL (you already have this)
✅ https://hfqhwdbdsvdbrorpnnbf.supabase.co

# anon/public key (safe for client-side)
📋 Look for the key labeled "anon" or "public"
   Starts with: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# service_role key (SECRET - backend only)
🔒 Look for the key labeled "service_role"
   Starts with: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### **Step 2: Update Your Local Environment Files**

#### **A. Web App** (`web/.env.local`)

✅ **Already created for you!** Just update the `NEXT_PUBLIC_SUPABASE_ANON_KEY`:

```bash
# File: web/.env.local

# ==========================================
# Supabase Configuration
# ==========================================
NEXT_PUBLIC_SUPABASE_URL=https://hfqhwdbdsvdbrorpnnbf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=paste-your-anon-key-here

# ==========================================
# API Configuration
# ==========================================
NEXT_PUBLIC_API_URL=http://localhost:4000

# ==========================================
# Site Configuration
# ==========================================
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**To update:**
```bash
cd web
nano .env.local
# Replace "your-anon-key-here" with your actual anon key
```

---

#### **B. Backend API** (`api/.env`)

✅ **Already created for you!** Update both keys:

```bash
# File: api/.env

# ==========================================
# SUPABASE DATABASE
# ==========================================
SUPABASE_URL=https://hfqhwdbdsvdbrorpnnbf.supabase.co
SUPABASE_SERVICE_ROLE=paste-your-service-role-key-here
SUPABASE_ANON_KEY=paste-your-anon-key-here

# ... rest of config
```

**To update:**
```bash
cd api
nano .env
# Replace the placeholder keys with your actual keys
```

---

#### **C. Mobile App** (`mobile/.env`)

```bash
# File: mobile/.env

# ==========================================
# Supabase Configuration
# ==========================================
EXPO_PUBLIC_SUPABASE_URL=https://hfqhwdbdsvdbrorpnnbf.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=paste-your-anon-key-here

# ... rest of config
```

**To update:**
```bash
cd mobile
nano .env
# Update the Supabase values
```

---

### **Step 3: Deploy Web App to Vercel**

#### **Option A: Via Vercel Dashboard (Recommended)**

1. **Go to Vercel:** https://vercel.com
2. **Import Project:**
   - Click "New Project"
   - Import from GitHub: `Magnus-Flipper-AI-v1.0-`
3. **Configure:**
   ```
   Framework Preset: Next.js
   Root Directory: web
   Build Command: (leave default)
   Output Directory: (leave default)
   ```

4. **Add Environment Variables:**
   Click "Environment Variables" and add these:

   | Name | Value | Where to Get |
   |------|-------|--------------|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://hfqhwdbdsvdbrorpnnbf.supabase.co` | - |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGci...` | Supabase → Settings → API → anon |
   | `NEXT_PUBLIC_API_URL` | `http://localhost:4000` | Update after deploying backend |
   | `NEXT_PUBLIC_SITE_URL` | `https://your-app.vercel.app` | Auto-filled after deploy |

5. **Deploy:**
   - Click "Deploy"
   - Wait 2-3 minutes
   - You'll get a URL like: `https://magnus-flipper-ai.vercel.app`

6. **Update API URL:**
   - After deploying your backend to Render, come back to Vercel
   - Go to Project Settings → Environment Variables
   - Update `NEXT_PUBLIC_API_URL` to your Render URL
   - Redeploy

---

#### **Option B: Via Vercel CLI**

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy from web directory
cd web
vercel

# Follow prompts and add environment variables when asked
```

---

### **Step 4: Test Your Supabase Connection**

#### **A. Local Testing**

```bash
# Start your web app
cd web
npm run dev

# Open browser console (F12)
# Run this in console to test connection:
```

```javascript
// In browser console
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://hfqhwdbdsvdbrorpnnbf.supabase.co',
  'YOUR_ANON_KEY'
);

// Test query
supabase.from('profiles').select('count').then(console.log);
// Should return: { data: [...], error: null } or similar
```

#### **B. Test Backend Connection**

```bash
cd api
npm install
npm run dev

# Should see:
# "✅ Supabase connected successfully" (or no warnings about Supabase)
```

---

### **Step 5: Set Up Database Schema**

Your Supabase database needs the tables. Run these in **Supabase SQL Editor**:

1. **Go to:** Supabase Dashboard → SQL Editor
2. **Create New Query**
3. **Run these files in order:**

**First - Base Schema:**
```sql
-- Copy and paste content from: db/schema.sql
-- Then click "Run"
```

**Second - Migrations:**
```sql
-- Copy and paste content from: db/migrations/001_add_deals_alerts_watchlists.sql
-- Then click "Run"
```

**Verify Tables Created:**
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';

-- Should show: profiles, deals, watchlists, alerts
```

---

## 🔐 Environment Variables Summary

### **For Vercel (Web App)**

Add these in Vercel Project Settings → Environment Variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://hfqhwdbdsvdbrorpnnbf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...  (get from Supabase)
NEXT_PUBLIC_API_URL=https://your-api.onrender.com/api/v1
NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app
```

### **For Render (Backend API)**

Add these in Render Service → Environment:

```bash
NODE_ENV=production
PORT=4000
SUPABASE_URL=https://hfqhwdbdsvdbrorpnnbf.supabase.co
SUPABASE_SERVICE_ROLE=eyJhbGci...  (get from Supabase - service_role)
SUPABASE_ANON_KEY=eyJhbGci...      (get from Supabase - anon)
REDIS_URL=redis://...              (get from Upstash)
```

### **For Mobile App (EAS Build)**

Add these as EAS secrets:

```bash
eas secret:create --name SUPABASE_URL --value "https://hfqhwdbdsvdbrorpnnbf.supabase.co"
eas secret:create --name SUPABASE_ANON_KEY --value "eyJhbGci..."
```

Or add to `mobile/.env` for local testing:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://hfqhwdbdsvdbrorpnnbf.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

---

## ✅ Verification Checklist

- [ ] **Got Supabase credentials**
  - [ ] Project URL: ✅ `https://hfqhwdbdsvdbrorpnnbf.supabase.co`
  - [ ] Anon key: copied from Dashboard
  - [ ] Service role key: copied from Dashboard

- [ ] **Updated local `.env` files**
  - [ ] `web/.env.local` ✅ (created)
  - [ ] `api/.env` ✅ (created)
  - [ ] `mobile/.env` (update if testing mobile)

- [ ] **Ran database migrations**
  - [ ] `db/schema.sql` executed
  - [ ] `db/migrations/001_*.sql` executed
  - [ ] Tables verified in Supabase

- [ ] **Deployed to Vercel**
  - [ ] Project imported
  - [ ] Environment variables added
  - [ ] Deployment successful
  - [ ] URL obtained

- [ ] **Tested connections**
  - [ ] Local web app connects
  - [ ] Local API connects
  - [ ] Vercel deployment connects

---

## 🐛 Troubleshooting

### "Invalid API key"
```bash
# Make sure you copied the FULL key
# anon key is very long (200+ characters)
# Starts with: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ...
```

### "CORS error from Supabase"
```bash
# Check Supabase Dashboard → Authentication → URL Configuration
# Add your Vercel URL to allowed domains:
https://your-app.vercel.app
```

### "Table doesn't exist"
```bash
# Run migrations in Supabase SQL Editor:
# 1. db/schema.sql
# 2. db/migrations/001_add_deals_alerts_watchlists.sql
```

### "Environment variables not working on Vercel"
```bash
# Make sure variable names start with NEXT_PUBLIC_
# Redeploy after adding variables:
vercel --prod
```

---

## 📝 Quick Commands Reference

```bash
# Local development
cd web && npm run dev          # Start web app
cd api && npm run dev          # Start backend API
cd mobile && npm start         # Start mobile app

# Deploy to Vercel
cd web && vercel --prod        # Deploy web app

# Test Supabase connection
curl https://hfqhwdbdsvdbrorpnnbf.supabase.co/rest/v1/ \
  -H "apikey: YOUR_ANON_KEY"
```

---

## 🎯 Next Steps

1. ✅ Get your anon key from Supabase Dashboard
2. ✅ Update `web/.env.local` with the anon key
3. ✅ Update `api/.env` with both keys (anon + service_role)
4. ✅ Run database migrations in Supabase SQL Editor
5. ✅ Deploy web app to Vercel
6. ✅ Test that everything works

---

**Your Supabase Project:** `hfqhwdbdsvdbrorpnnbf`
**Supabase URL:** `https://hfqhwdbdsvdbrorpnnbf.supabase.co`
**Status:** Ready to connect! Just need to copy the anon key from Dashboard.

🚀 **You're almost there!**
