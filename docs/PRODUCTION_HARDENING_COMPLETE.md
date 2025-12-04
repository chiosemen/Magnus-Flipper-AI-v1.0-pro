# Production Hardening & Security Checklist

## 🔒 Security Layers

### 1. Authentication & Authorization ✅ (Completed)

**Supabase RLS Policies** - Row Level Security enforced on all tables
- ✅ Users can only access their own data
- ✅ Service role bypasses RLS for worker operations
- ✅ Public read access only on scraped listings
- ✅ Admin-only access on sensitive tables

**NextAuth Configuration**
```typescript
// Verify these settings in apps/web/app/api/auth/[...nextauth]/route.ts
- Session strategy: "jwt"
- Session max age: 30 days
- JWT secret: NEXTAUTH_SECRET (rotate every 90 days)
- Callbacks: session, jwt properly configured
```

### 2. API Rate Limiting (TODO - HIGH PRIORITY)

**Implement at Edge (Vercel Middleware)**
```typescript
// apps/web/middleware.ts - Add rate limiting
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
  analytics: true,
});

export async function middleware(request: NextRequest) {
  const ip = request.ip ?? "127.0.0.1";
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return new Response("Rate limit exceeded", { status: 429 });
  }

  return next();
}
```

**Rate Limits by Endpoint**:
- `/api/scraper/trigger`: 5 requests / minute
- `/api/profit/*`: 60 requests / minute
- `/api/shipping/label`: 10 requests / minute
- `/api/*`: 100 requests / minute (global)

**Azure Functions** - Already configured in `host.json`:
```json
{
  "functionTimeout": "00:10:00",
  "extensions": {
    "http": {
      "maxOutstandingRequests": 20,
      "maxConcurrentRequests": 10
    }
  }
}
```

### 3. API Key Rotation Schedule

**Critical Keys - Rotate Every 90 Days**:
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `STRIPE_SECRET_KEY`
- [ ] `NEXTAUTH_SECRET`
- [ ] Carrier API keys (USPS, UPS, FedEx)

**Rotation Procedure**:
1. Generate new key in provider dashboard
2. Add new key to environment (keep old)
3. Deploy with new key
4. Monitor for errors (24 hours)
5. Remove old key

**Automation Script**:
```bash
#!/bin/bash
# scripts/rotate-keys.sh
# TODO: Implement automated key rotation with grace period
```

### 4. CORS Configuration

**Current**: Permissive (`*`) - NEEDS RESTRICTION

**Production CORS** (Update in `vercel.json` and API routes):
```json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "https://flipperagents.com" },
        { "key": "Access-Control-Allow-Methods", "value": "GET,POST,PUT,DELETE,OPTIONS" },
        { "key": "Access-Control-Allow-Headers", "value": "Content-Type, Authorization" },
        { "key": "Access-Control-Max-Age", "value": "86400" }
      ]
    }
  ]
}
```

### 5. IP Allowlisting (TODO - MEDIUM PRIORITY)

**Supabase Database**:
```sql
-- Add IP restrictions in Supabase Dashboard → Settings → Database
-- Allow: Azure Functions IPs, Vercel IPs, Your office IP
```

**Azure Functions**:
```bash
# Restrict function app to Supabase IPs only
az functionapp config access-restriction add \
  --resource-group magnus-flipper-rg \
  --name worker-scraper \
  --rule-name "Allow Supabase" \
  --action Allow \
  --ip-address 54.x.x.x/32 \
  --priority 100
```

### 6. Secrets Management

**Current**: Environment variables (acceptable)

**Production Best Practices**:
- ✅ No secrets in code
- ✅ No secrets in git
- ✅ Separate dev/prod secrets
- ❌ TODO: Migrate to Azure Key Vault for workers
- ❌ TODO: Enable Vercel secret scanning

**Azure Key Vault Integration**:
```typescript
// For worker apps - store in Key Vault
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

const credential = new DefaultAzureCredential();
const client = new SecretClient("https://magnus-vault.vault.azure.net", credential);
const secret = await client.getSecret("STRIPE_SECRET_KEY");
```

### 7. Error Monitoring & Logging

**Setup Sentry** (TODO - HIGH PRIORITY)

**Install**:
```bash
pnpm add @sentry/nextjs @sentry/node
```

**Configure** (`apps/web/sentry.client.config.ts`):
```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay(),
  ],
});
```

**Azure Functions Logging**:
```typescript
// Add Application Insights to all workers
import { TelemetryClient } from "applicationinsights";
const client = new TelemetryClient(process.env.APPLICATIONINSIGHTS_CONNECTION_STRING);
client.trackEvent({ name: "ScraperCompleted", properties: { marketplace: "ebay" } });
```

### 8. Audit Logging

**Implement Audit Trail** (TODO - MEDIUM PRIORITY)

**Create Audit Table**:
```sql
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
```

**Audit Helper**:
```typescript
// lib/audit.ts
export async function logAudit(params: {
  userId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  metadata?: any;
}) {
  await supabase.from("audit_logs").insert({
    user_id: params.userId,
    action: params.action,
    resource_type: params.resourceType,
    resource_id: params.resourceId,
    metadata: params.metadata,
    created_at: new Date().toISOString(),
  });
}
```

**Actions to Audit**:
- User login/logout
- API key generation
- Scraper configuration changes
- Purchase attempts (auto-buyer)
- Listing creation (auto-lister)
- Shipping label generation
- Profit ledger modifications

### 9. Data Validation & Sanitization

**Input Validation with Zod** ✅ (Already implemented in packages)

**Additional API Route Validation**:
```typescript
// Wrap all API routes with validation
import { z } from "zod";

const requestSchema = z.object({
  marketplace: z.enum(["ebay", "facebook", "craigslist"]),
  price: z.number().positive().max(10000),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const validation = requestSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: "Invalid input", details: validation.error.errors },
      { status: 400 }
    );
  }

  // Process validated data
}
```

### 10. SQL Injection Prevention

**✅ Already Protected** - Using Supabase client with parameterized queries

**Verify No Raw SQL**:
```bash
# Search for dangerous patterns
grep -r "`.sql\`" packages/
grep -r "exec(" packages/
grep -r "raw(" packages/
```

### 11. XSS Prevention

**Content Security Policy** (Add to `next.config.ts`):
```typescript
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net;
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https:;
      font-src 'self' data:;
      connect-src 'self' https://*.supabase.co https://api.stripe.com;
    `.replace(/\s{2,}/g, ' ').trim()
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()'
  }
];

module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};
```

### 12. Database Backup Strategy

**Supabase Automated Backups** ✅
- Daily backups (7 days retention) - FREE tier
- Point-in-time recovery - PRO tier

**Manual Backup Script**:
```bash
#!/bin/bash
# scripts/backup-database.sh
pg_dump "$DATABASE_URL" > "backup-$(date +%Y%m%d).sql"
# Upload to S3/Azure Blob
```

**Test Restore Procedure**:
```bash
# Verify backups work
psql "$DATABASE_URL" < backup-20241202.sql
```

### 13. Scraper Anti-Ban Hardening ✅ (Already Implemented)

**Current Protections**:
- ✅ Browser fingerprint evasion
- ✅ Human-like behavior (random delays, mouse movement)
- ✅ Proxy rotation support
- ✅ Rate limiting between requests
- ✅ User-Agent randomization
- ✅ Cookie persistence

**Additional Recommendations**:
- [ ] Implement captcha solving (2Captcha, Anti-Captcha)
- [ ] Add residential proxy pool (not datacenter)
- [ ] Rotate user accounts for marketplaces
- [ ] Monitor ban rates and auto-pause scrapers

### 14. Payment Security (Stripe)

**✅ Already Secured**:
- Using Stripe.js (PCI compliant)
- No card data touches our servers
- Webhook signature verification
- Test mode in dev, live in prod

**Additional Checks**:
- [ ] Enable Stripe Radar (fraud detection)
- [ ] Set up 3D Secure for high-value transactions
- [ ] Monitor for suspicious payment patterns
- [ ] Implement dispute handling workflow

### 15. HTTPS & SSL

**✅ Enforced**:
- Vercel: Automatic HTTPS
- Supabase: TLS 1.2+ required
- Azure Functions: HTTPS only

**Certificate Management**:
- Vercel: Automatic Let's Encrypt renewal
- Custom domain: Verify DNS CAA records

### 16. DDoS Protection

**Cloudflare (Recommended)**:
```bash
# Add Cloudflare in front of Vercel
1. Point DNS to Cloudflare nameservers
2. Enable "Under Attack" mode if needed
3. Set up rate limiting rules
4. Enable Bot Fight Mode
```

**Vercel Built-in**:
- Edge network (global)
- Automatic scaling
- DDoS mitigation

### 17. Dependency Security

**Audit Dependencies**:
```bash
# Check for vulnerabilities
pnpm audit

# Fix automatically
pnpm audit --fix

# Update all dependencies
pnpm update --latest
```

**Dependabot** (GitHub):
```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
```

### 18. Access Control

**Admin Panel Gating** ✅ (Implemented in RLS)

**Additional Hardening**:
```typescript
// Middleware for admin routes
export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Check if user has admin role
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }
  return NextResponse.next();
}
```

### 19. Monitoring Dashboards

**Setup (TODO - HIGH PRIORITY)**:

1. **Vercel Analytics** ✅ (Free, already enabled)
2. **Supabase Dashboard** ✅ (Built-in)
3. **Azure Monitor** (Configure):
```bash
az monitor app-insights component create \
  --app magnus-insights \
  --location eastus \
  --resource-group magnus-flipper-rg
```

4. **Custom Dashboard** (Build in Next.js):
   - `/admin/health` - Worker status
   - `/admin/metrics` - Key metrics
   - `/admin/errors` - Error logs
   - `/admin/audit` - Audit trail

### 20. Incident Response Plan

**Create Runbook** (`docs/INCIDENT_RESPONSE.md`):

**P0 - Critical (Database Down)**:
1. Check Supabase status page
2. Verify DATABASE_URL connection
3. Check Vercel deployment status
4. Contact Supabase support

**P1 - High (Worker Failing)**:
1. Check Azure Functions logs
2. Verify environment variables
3. Check database connections
4. Restart function app

**P2 - Medium (Scraper Banned)**:
1. Pause scraper for marketplace
2. Rotate proxy/account
3. Adjust delays/rate limits
4. Resume after cooldown

**P3 - Low (Single API Error)**:
1. Check Sentry for error details
2. Review request logs
3. Fix if systemic
4. Monitor for recurrence

## Production Readiness Checklist

### Before Launch
- [ ] All environment variables set in Vercel
- [ ] All environment variables set in Azure
- [ ] Database migrations run on production
- [ ] Stripe webhook endpoint configured
- [ ] Carrier API keys tested
- [ ] Rate limiting implemented
- [ ] Sentry error monitoring configured
- [ ] SSL certificates valid
- [ ] CORS restricted to production domain
- [ ] Admin accounts created
- [ ] Backup strategy tested
- [ ] Load testing completed

### Day 1 Post-Launch
- [ ] Monitor error rates (< 1%)
- [ ] Verify workers running (check logs)
- [ ] Check database performance
- [ ] Monitor API response times (< 500ms)
- [ ] Verify payments processing
- [ ] Check scraper success rates (> 90%)
- [ ] Review user signup flow
- [ ] Test critical user journeys

### Week 1 Post-Launch
- [ ] Review Sentry errors
- [ ] Analyze performance metrics
- [ ] Check database growth rate
- [ ] Verify backup restoration
- [ ] Audit security logs
- [ ] Review API usage patterns
- [ ] Test disaster recovery

## Security Contacts

**Report Security Issues**:
- Email: security@flipperagents.com
- GitHub: Private security advisory
- Response SLA: 24 hours

## Compliance

**GDPR Compliance** (If serving EU users):
- [ ] Privacy policy updated
- [ ] Cookie consent implemented
- [ ] Data deletion endpoint
- [ ] Data export endpoint
- [ ] User consent tracking

**CCPA Compliance** (If serving CA users):
- [ ] Do Not Sell link
- [ ] Data deletion on request
- [ ] Privacy policy disclosure

## Performance Targets

- **API Response Time**: < 200ms (p50), < 500ms (p99)
- **Database Query Time**: < 50ms (p50), < 200ms (p99)
- **Scraper Success Rate**: > 90%
- **Worker Uptime**: > 99.5%
- **Error Rate**: < 1%
- **Page Load Time**: < 2s (First Contentful Paint)

## Monitoring Alerts (Configure in Sentry/Azure)

- Database connection errors
- API 5xx errors (> 10/min)
- Worker failures (> 3 consecutive)
- Scraper bans detected
- Payment processing failures
- Rate limit exceeded (> 100/min)
- High memory usage (> 80%)
- Slow queries (> 1s)

## Next Steps (Priority Order)

1. **Implement rate limiting** (Upstash Redis + Vercel middleware)
2. **Setup Sentry error monitoring**
3. **Configure Application Insights for workers**
4. **Create audit logging table and helpers**
5. **Add Content Security Policy headers**
6. **Setup automated dependency audits**
7. **Create admin monitoring dashboard**
8. **Write incident response runbook**
9. **Implement key rotation automation**
10. **Setup Cloudflare for DDoS protection**

---

**Last Updated**: 2024-12-02
**Review Frequency**: Monthly
**Owner**: Engineering Team
