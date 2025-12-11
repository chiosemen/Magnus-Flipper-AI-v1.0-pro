# MAGNUS ENV AUDIT REPORT v1

Generated: 2025-12-09T16:53:06.172Z

## 📊 Summary

- **Total env files scanned**: 14
- **Total variables found**: 115
- **Missing variables**: 19
- **Encoding issues**: 1
- **Placement issues**: 0

---

## ❌ Missing Variables

### ROOT
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `DATABASE_URL`
- `OPENAI_API_KEY`
- `GEMINI_API_KEY`

### VERCEL
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_API_BASE_URL`
- `AI_GATEWAY_API_KEY`

### AZURE
- `SUPABASE_DB_URL`
- `OPENAI_API_KEY`
- `GEMINI_API_KEY`

### GITHUB
- `SUPABASE_DB_URL`
- `SUPABASE_STAGING_DB_URL`
- `AZURE_CLIENT_ID`
- `AZURE_CLIENT_SECRET`
- `AZURE_TENANT_ID`
- `AZURE_SUBSCRIPTION_ID`
- `VERCEL_TOKEN`

### EXPO
✅ All good

---

## 🔐 Encoding Issues

### .env.example.backup → `DATABASE_URL`
- DATABASE_URL contains unencoded '@' - should use %40

---

## ⚠️ Placement Issues

✅ No placement issues found

---

## 📁 Scanned Files

- `/Users/chinyeosemene/Developer/Magnus-Flipper-AI-v1.0-pro-reset/.env.development`
- `/Users/chinyeosemene/Developer/Magnus-Flipper-AI-v1.0-pro-reset/.env.example`
- `/Users/chinyeosemene/Developer/Magnus-Flipper-AI-v1.0-pro-reset/.env.example.backup`
- `/Users/chinyeosemene/Developer/Magnus-Flipper-AI-v1.0-pro-reset/.env.local`
- `/Users/chinyeosemene/Developer/Magnus-Flipper-AI-v1.0-pro-reset/.env.production`
- `/Users/chinyeosemene/Developer/Magnus-Flipper-AI-v1.0-pro-reset/.env.production.template`
- `/Users/chinyeosemene/Developer/Magnus-Flipper-AI-v1.0-pro-reset/apps/mobile/.env.development`
- `/Users/chinyeosemene/Developer/Magnus-Flipper-AI-v1.0-pro-reset/apps/mobile/.env.example`
- `/Users/chinyeosemene/Developer/Magnus-Flipper-AI-v1.0-pro-reset/apps/mobile/.env.production`
- `/Users/chinyeosemene/Developer/Magnus-Flipper-AI-v1.0-pro-reset/apps/mobile/.env.production.template`
- `/Users/chinyeosemene/Developer/Magnus-Flipper-AI-v1.0-pro-reset/apps/web/.env.example`
- `/Users/chinyeosemene/Developer/Magnus-Flipper-AI-v1.0-pro-reset/apps/web/.env.local`
- `/Users/chinyeosemene/Developer/Magnus-Flipper-AI-v1.0-pro-reset/apps/worker/.env.example`
- `/Users/chinyeosemene/Developer/Magnus-Flipper-AI-v1.0-pro-reset/standalone-version/.env.example`

---

## 📝 Notes

- **SERVICE_ROLE_KEY** must NOT appear in Vercel public env vars or Expo/mobile env files
- **DATABASE_URL** must use encoded password: `%40` for '@', `%24` for '$'
- **REDIS_URL** must use encoded password too
- **NEXT_PUBLIC_*** vars should only be in web/mobile apps, never in workers or API servers
- **SUPABASE_SERVICE_ROLE_KEY** should only be in backend/worker environments

---

## 🔧 Next Steps

Run the EnvSyncOrchestrator to generate sync commands for missing variables.

