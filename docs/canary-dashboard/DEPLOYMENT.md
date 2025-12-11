# Canary Dashboard Deployment Guide

## Prerequisites

1. **Supabase Project**
   - Create a new Supabase project
   - Run the schema migration: `supabase/canary_dashboard_schema.sql`
   - Get your project URL and service role key

2. **Vercel Account**
   - Create a Vercel account
   - Install Vercel CLI: `npm i -g vercel`

3. **API Keys**
   - OpenAI API key (or DeepSeek/Claude)
   - Azure credentials (for log streaming)

## Step 1: Setup Supabase

```bash
# Connect to your Supabase project
supabase link --project-ref your-project-ref

# Run the schema migration
psql $DATABASE_URL -f supabase/canary_dashboard_schema.sql
```

## Step 2: Configure Environment Variables

Create `.env.local` in `apps/canary-dashboard/`:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DASHBOARD_ADMIN_TOKEN=generate-secure-random-token
AZURE_SUBSCRIPTION_ID=your-subscription-id
AZURE_RESOURCE_GROUP=magnus-rg
OPENAI_API_KEY=sk-...
DEEPSEEK_API_KEY=sk-...
CLAUDE_API_KEY=sk-ant-...
```

## Step 3: Deploy to Vercel

```bash
cd apps/canary-dashboard

# Install dependencies
pnpm install

# Deploy
vercel --prod
```

Or use GitHub Actions (automated):

```bash
# Push to main branch
git push origin main
```

The workflow `.github/workflows/deploy_dashboard.yml` will automatically deploy.

## Step 4: Setup Background Workers

### Canary Ingestor

Add to GitHub Actions workflow or CRON:

```yaml
- name: Run Canary Ingestor
  run: |
    cd apps/canary-ingestor
    pnpm install
    pnpm ingest
```

### Canary Streamer

Deploy as Azure Function or separate Node.js service:

```bash
cd apps/canary-streamer
pnpm install
pnpm build
# Deploy to your hosting platform
```

## Step 5: Configure Vercel Environment Variables

In Vercel dashboard, add all environment variables from `.env.local`.

## Step 6: Access Dashboard

1. Navigate to your Vercel deployment URL
2. Login with your `DASHBOARD_ADMIN_TOKEN`
3. Dashboard will start showing real-time canary data

## Troubleshooting

### Dashboard shows "No data"
- Check Supabase connection
- Verify workers are running
- Check API routes are accessible

### WebSocket not connecting
- Verify WebSocket server is running (for streamer)
- Check firewall rules
- Use polling fallback if WebSocket unavailable

### ML decisions not appearing
- Verify API keys are set correctly
- Check ML committee is receiving logs
- Review Supabase `canary_ml_decisions` table

## Production Checklist

- [ ] Supabase RLS policies configured
- [ ] Environment variables secured
- [ ] Dashboard admin token rotated
- [ ] WebSocket server deployed
- [ ] Background workers scheduled
- [ ] Monitoring alerts configured
- [ ] Backup strategy in place
