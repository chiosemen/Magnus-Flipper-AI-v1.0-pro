# Render.com Deployment Guide - Magnus Flipper AI API

## 🚀 Quick Deploy

### Option 1: One-Click Deploy (Recommended)

1. **Click the Deploy to Render button:**
   [![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/chiosemen/Magnus-Flipper-AI-v1.0-)

2. **Set environment variables in the Render dashboard:**
   - BASE_URL: `https://your-service.onrender.com`
   - ALLOWED_ORIGINS: `https://flipperagents.com,https://app.flipperagents.com`
   - SUPABASE_URL: `https://hfqhwd...supabase.co`
   - SUPABASE_SERVICE_ROLE: `your-service-role-key`
   - SUPABASE_ANON_KEY: `your-anon-key`
   - SUPABASE_JWT_SECRET: `your-jwt-secret`
   - JWT_SECRET: `your-64-char-secret`
   - STRIPE_SECRET_KEY: `sk_live_...`
   - STRIPE_WEBHOOK_SECRET: `whsec_...`
   - REDIS_URL: `redis://default:password@host:6379`

3. **Deploy!** Render will:
   - Build the Docker image from `Dockerfile.render`
   - Install production dependencies
   - Run health checks on `/health`
   - Expose the API at `https://your-service.onrender.com`

### Option 2: Manual Deployment

1. **Create New Web Service:**
   - Go to https://dashboard.render.com/select-repo
   - Connect your GitHub: `chiosemen/Magnus-Flipper-AI-v1.0-`

2. **Configure Service:**
   - **Name:** magnus-flipper-ai-api
   - **Region:** Oregon (US West)
   - **Branch:** main
   - **Runtime:** Docker
   - **Dockerfile Path:** `./Dockerfile.render`
   - **Plan:** Starter ($7/month)

3. **Set Environment Variables:** (Same as Option 1)

4. **Advanced Settings:**
   - **Health Check Path:** `/health`
   - **Auto-Deploy:** Yes

## 📋 Deployment Features

- ✅ **Docker-based:** No serverless constraints
- ✅ **Persistent connections:** Redis, WebSockets supported
- ✅ **Health checks:** Automatic monitoring
- ✅ **Auto-deploy:** Updates on git push
- ✅ **Better logs:** Full stdout/stderr access
- ✅ **No bundle size limits:** 3.1MB bundle works perfectly

## 🔍 Verify Deployment

After deployment completes, test endpoints:

```bash
# Health check
curl https://your-service.onrender.com/health

# API root
curl https://your-service.onrender.com/

# Deals endpoint
curl https://your-service.onrender.com/api/v1/deals?limit=5
```

## 🐛 Troubleshooting

**Build fails:**
- Check Render build logs in dashboard
- Verify `packages/api/dist/` files are committed
- Ensure pnpm-lock.yaml is present

**Runtime errors:**
- Check Render logs: Dashboard → Logs tab
- Verify all environment variables are set
- Check health check endpoint: `/health`

**Redis connection issues:**
- Ensure REDIS_URL is correct format: `redis://user:pass@host:port`
- Check Redis is accessible from Render's IP ranges

## 🚦 Advantages Over Vercel

| Feature | Vercel | Render |
|---------|--------|--------|
| Bundle size limit | 50MB compressed | None |
| Execution time | 10s (Hobby), 60s (Pro) | No limit |
| Persistent connections | ❌ | ✅ |
| WebSockets | Limited | ✅ |
| Logs access | Limited via API | Full access |
| Redis support | External only | Native |
| Docker support | ❌ | ✅ |
| Pricing | $20/mo Pro | $7/mo Starter |

## 📄 Files Created

- `Dockerfile.render` - Production Docker configuration
- `render.yaml` - Infrastructure as Code config
- `.dockerignore` - Optimizes Docker build context
- `RENDER_DEPLOYMENT.md` - This guide

🤖 Generated with [Claude Code](https://claude.com/claude-code)
