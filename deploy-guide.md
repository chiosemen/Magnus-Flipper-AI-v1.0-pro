# Deploy Guide

## Web (Next.js → Vercel)
- Root: web/
- Env: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_SITE_URL
- Deploy

## API (FastAPI → Render)
- Root: api/
- Start: uvicorn app.main:app --host 0.0.0.0 --port $PORT
- Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE, DISCORD_WEBHOOK_URL, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID

## DB (Supabase)
- Run db/schema.sql then db/seed.sql
- Apply RLS from db/README_DB.md

## Mobile (Expo)
npm install
npx expo start

---
🏗️ Powered by Magnus-Tech.AI
