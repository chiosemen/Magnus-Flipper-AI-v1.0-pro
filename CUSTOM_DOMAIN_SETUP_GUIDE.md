# 🌐 MAGNUS FLIPPER AI - CUSTOM DOMAIN SETUP GUIDE

**Target Domain:** `api.flipperagents.com`
**Vercel Project:** `magnus-flipper-ai-v1-0-api-9gw4`
**Project ID:** `prj_JWEPz5xWQ1ubp9JOHe7bifQ2IepF`
**Current Production URL:** https://magnus-flipper-ai-v1-0-api-9gw4.vercel.app

---

## 📋 SETUP OVERVIEW

This guide will walk you through:
1. Adding custom domain to Vercel project
2. Configuring DNS records
3. Disabling deployment protection for production
4. Testing endpoints with bypass token (for preview deployments)
5. Verifying SSL certificate

---

## 🎯 STEP 1: ADD CUSTOM DOMAIN VIA VERCEL API

### Option A: Via Vercel API (Automated)

```bash
# Add api.flipperagents.com to your Vercel project
curl -X POST \
  -H "Authorization: Bearer 032Q45KOVnOEcP7f4RgwNNNZ" \
  -H "Content-Type: application/json" \
  "https://api.vercel.com/v10/projects/prj_JWEPz5xWQ1ubp9JOHe7bifQ2IepF/domains" \
  -d '{
    "name": "api.flipperagents.com"
  }'
```

**Expected Response:**
```json
{
  "name": "api.flipperagents.com",
  "apexName": "flipperagents.com",
  "projectId": "prj_JWEPz5xWQ1ubp9JOHe7bifQ2IepF",
  "verified": false,
  "verification": [
    {
      "type": "TXT",
      "domain": "_vercel",
      "value": "vc-domain-verify=...",
      "reason": "CNAME_VERIFICATION"
    }
  ]
}
```

### Option B: Via Vercel Dashboard (Manual)

1. Go to https://vercel.com/chiosemens-projects/magnus-flipper-ai-v1-0-api-9gw4/settings/domains
2. Click **"Add Domain"**
3. Enter: `api.flipperagents.com`
4. Click **"Add"**

---

## 🌍 STEP 2: CONFIGURE DNS RECORDS

You need to add DNS records to your domain registrar (where you registered `flipperagents.com`).

### DNS Configuration

Add the following records to your DNS provider:

#### Record 1: CNAME for API Subdomain
```
Type:  CNAME
Name:  api
Value: cname.vercel-dns.com
TTL:   3600 (or Auto)
```

#### Record 2: TXT for Domain Verification (if required by Vercel)
```
Type:  TXT
Name:  _vercel
Value: vc-domain-verify=[value-from-vercel-response]
TTL:   3600 (or Auto)
```

### DNS Provider Instructions

**Cloudflare:**
1. Login to Cloudflare dashboard
2. Select `flipperagents.com` domain
3. Go to **DNS** → **Records**
4. Click **Add record**
5. Add CNAME record as shown above
6. Set Proxy status to **DNS only** (grey cloud icon)

**Namecheap:**
1. Login to Namecheap
2. Go to **Domain List** → Manage `flipperagents.com`
3. Click **Advanced DNS**
4. Add CNAME record under **Host Records**

**GoDaddy:**
1. Login to GoDaddy
2. Go to **My Products** → **DNS**
3. Select `flipperagents.com`
4. Add CNAME record

**Route53 (AWS):**
```bash
# Create hosted zone if not exists
aws route53 create-hosted-zone --name flipperagents.com --caller-reference $(date +%s)

# Add CNAME record
aws route53 change-resource-record-sets --hosted-zone-id YOUR_ZONE_ID --change-batch '{
  "Changes": [{
    "Action": "CREATE",
    "ResourceRecordSet": {
      "Name": "api.flipperagents.com",
      "Type": "CNAME",
      "TTL": 300,
      "ResourceRecords": [{"Value": "cname.vercel-dns.com"}]
    }
  }]
}'
```

---

## 🔍 STEP 3: VERIFY DNS PROPAGATION

Wait 5-10 minutes for DNS to propagate, then verify:

```bash
# Check CNAME record
dig api.flipperagents.com CNAME +short
# Expected: cname.vercel-dns.com

# Alternative: Use nslookup
nslookup api.flipperagents.com
# Expected: points to Vercel's servers

# Check from multiple locations
# Visit: https://dnschecker.org/#CNAME/api.flipperagents.com
```

---

## 🔐 STEP 4: CONFIGURE DEPLOYMENT PROTECTION

### Disable Protection for Production Domain

Once your custom domain is added, you should disable deployment protection for the production domain to allow public API access.

#### Via Vercel Dashboard:
1. Go to https://vercel.com/chiosemens-projects/magnus-flipper-ai-v1-0-api-9gw4/settings/deployment-protection
2. Under **"Vercel Authentication"**, select:
   - ✅ **"Standard Protection"** for preview deployments (keeps preview protected)
   - ⚪ **"All Deployments"** (uncheck this - allows production to be public)
3. Or alternatively, select **"Only Preview Deployments"** to keep protection only on previews
4. Click **"Save"**

#### Via Vercel API:
```bash
# Update deployment protection settings
curl -X PATCH \
  -H "Authorization: Bearer 032Q45KOVnOEcP7f4RgwNNNZ" \
  -H "Content-Type: application/json" \
  "https://api.vercel.com/v9/projects/prj_JWEPz5xWQ1ubp9JOHe7bifQ2IepF" \
  -d '{
    "passwordProtection": null,
    "ssoProtection": {
      "deploymentType": "preview"
    }
  }'
```

---

## 🔑 STEP 5: GET BYPASS TOKEN FOR PREVIEW DEPLOYMENTS

For testing preview deployments that are still protected, you need a bypass token.

### Method 1: Via Vercel Dashboard

1. Go to https://vercel.com/chiosemens-projects/magnus-flipper-ai-v1-0-api-9gw4/settings/deployment-protection
2. Scroll to **"Protection Bypass for Automation"**
3. Click **"Create Token"**
4. Name it: `API Testing Token`
5. Select scope: **"Automation"**
6. Copy the generated token (starts with `pb_`)

### Method 2: From Deployment Page

1. Go to any preview deployment
2. When you see the authentication page
3. Click **"Continue with Vercel"** and login
4. Once authenticated, you can extract the bypass cookie from browser DevTools
5. Look for `_vercel_jwt` cookie

### Using the Bypass Token

Once you have the token, use it like this:

```bash
# Set bypass cookie
export BYPASS_TOKEN="pb_your_token_here"

# Test with bypass token (Method 1: Query parameter)
curl "https://magnus-flipper-ai-v1-0-api-9gw4-preview.vercel.app/health?x-vercel-protection-bypass=${BYPASS_TOKEN}"

# Test with bypass token (Method 2: Header)
curl -H "x-vercel-protection-bypass: ${BYPASS_TOKEN}" \
  "https://magnus-flipper-ai-v1-0-api-9gw4-preview.vercel.app/health"

# Set the bypass cookie (Method 3: Cookie)
curl "https://magnus-flipper-ai-v1-0-api-9gw4-preview.vercel.app/health?x-vercel-set-bypass-cookie=${BYPASS_TOKEN}"
```

---

## ✅ STEP 6: VERIFY CUSTOM DOMAIN

### Check Domain Status via API

```bash
# Get domain configuration
curl -H "Authorization: Bearer 032Q45KOVnOEcP7f4RgwNNNZ" \
  "https://api.vercel.com/v9/projects/prj_JWEPz5xWQ1ubp9JOHe7bifQ2IepF/domains/api.flipperagents.com" | jq '.'

# Expected response:
# {
#   "name": "api.flipperagents.com",
#   "verified": true,
#   "createdAt": 1234567890,
#   "gitBranch": null
# }
```

### Test SSL Certificate

```bash
# Check SSL certificate
curl -vI https://api.flipperagents.com/health 2>&1 | grep "SSL certificate verify ok"

# Check certificate details
openssl s_client -connect api.flipperagents.com:443 -servername api.flipperagents.com < /dev/null 2>/dev/null | openssl x509 -noout -subject -issuer -dates
```

---

## 🧪 STEP 7: TEST API ENDPOINTS

Once the domain is configured and SSL is active, test all endpoints:

### Health Endpoint
```bash
curl -i https://api.flipperagents.com/health

# Expected response:
# HTTP/2 200
# Content-Type: application/json
# {
#   "status": "healthy",
#   "timestamp": "2025-11-09T...",
#   "uptime": 12345,
#   "environment": "production"
# }
```

### Deals Endpoint
```bash
curl -i https://api.flipperagents.com/api/v1/deals

# Expected: 200 OK with deals array
```

### Auth Endpoint
```bash
curl -i -X POST https://api.flipperagents.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword"
  }'

# Expected: 200 OK with JWT token or 401 Unauthorized
```

### Stripe Webhook Endpoint
```bash
curl -i -X POST https://api.flipperagents.com/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -H "Stripe-Signature: test" \
  -d '{
    "type": "checkout.session.completed",
    "data": {}
  }'

# Expected: 400 or 401 (signature verification required)
```

---

## 🚀 STEP 8: UPDATE ENVIRONMENT CONFIGURATIONS

Once the custom domain is live, update your environment variables across all services:

### Update Mobile App (.env)
```bash
# mobile/.env
EXPO_PUBLIC_API_URL=https://api.flipperagents.com
```

### Update Web App (.env.local)
```bash
# web/.env.local
NEXT_PUBLIC_API_URL=https://api.flipperagents.com
```

### Update Stripe Webhook URL
```bash
# In Stripe Dashboard:
# 1. Go to Developers → Webhooks
# 2. Update endpoint URL to: https://api.flipperagents.com/api/webhooks/stripe
# 3. Update STRIPE_WEBHOOK_SECRET in Vercel env vars if new secret is generated
```

### Update CORS Configuration
Ensure `api/.env` has correct ALLOWED_ORIGINS:
```bash
ALLOWED_ORIGINS=https://flipperagents.com,https://www.flipperagents.com,https://app.flipperagents.com
```

---

## 🛠️ TROUBLESHOOTING

### Domain Not Verifying

**Problem:** Domain shows as "pending verification"

**Solutions:**
1. Check DNS propagation: `dig api.flipperagents.com CNAME +short`
2. Verify CNAME points to `cname.vercel-dns.com`
3. Wait 10-15 minutes for DNS to propagate globally
4. Try removing and re-adding the domain

### SSL Certificate Not Issued

**Problem:** HTTPS shows certificate error

**Solutions:**
1. Wait 5-10 minutes after domain verification
2. Vercel auto-issues Let's Encrypt certificates
3. Check Vercel dashboard for certificate status
4. Ensure DNS is correctly configured (no proxy if using Cloudflare)

### 502 Bad Gateway

**Problem:** Domain returns 502 error

**Solutions:**
1. Check Vercel deployment status: https://vercel.com/chiosemens-projects/magnus-flipper-ai-v1-0-api-9gw4
2. Verify latest deployment is in READY state
3. Check function logs in Vercel dashboard
4. Ensure environment variables are set

### 404 Not Found

**Problem:** Endpoints return 404

**Solutions:**
1. Verify `vercel.json` routes configuration
2. Check that `dist/server.js` exists in deployment
3. Review deployment logs for build errors
4. Ensure `outputDirectory` is correct in vercel.json

### Authentication Required on Production

**Problem:** Production domain still shows Vercel authentication

**Solutions:**
1. Go to Deployment Protection settings
2. Set protection to "Only Preview Deployments"
3. Redeploy if necessary
4. Clear browser cache and cookies

---

## 📊 VERIFICATION CHECKLIST

After completing setup, verify:

- [ ] DNS CNAME record added and propagated
- [ ] Domain added to Vercel project
- [ ] Domain verification successful
- [ ] SSL certificate issued (HTTPS working)
- [ ] Deployment protection disabled for production
- [ ] `/health` endpoint returns 200 OK
- [ ] `/api/v1/deals` endpoint accessible
- [ ] `/api/v1/auth/login` endpoint responds
- [ ] `/api/webhooks/stripe` endpoint exists
- [ ] Mobile app updated with new API URL
- [ ] Web app updated with new API URL
- [ ] Stripe webhook URL updated
- [ ] CORS configured for all subdomains
- [ ] All environment variables configured in Vercel

---

## 🔐 SECURITY BEST PRACTICES

### Production Domain
- ✅ Use HTTPS only (Vercel provides automatic SSL)
- ✅ Keep deployment protection disabled for public API
- ✅ Use authentication middleware for protected endpoints
- ✅ Configure CORS to allow only your domains
- ✅ Implement rate limiting (already configured via Redis)
- ✅ Use environment variables for all secrets
- ✅ Enable Vercel Web Application Firewall (WAF)

### Preview Deployments
- ✅ Keep Vercel authentication enabled
- ✅ Use bypass tokens for automated testing
- ✅ Rotate bypass tokens periodically
- ✅ Don't commit bypass tokens to git
- ✅ Use separate environment variables for preview

---

## 📞 SUPPORT RESOURCES

### Vercel Documentation
- [Custom Domains](https://vercel.com/docs/projects/domains)
- [Deployment Protection](https://vercel.com/docs/security/deployment-protection)
- [SSL Certificates](https://vercel.com/docs/security/encryption)
- [DNS Configuration](https://vercel.com/docs/projects/domains/working-with-domains)

### DNS Checker Tools
- https://dnschecker.org
- https://www.whatsmydns.net
- https://mxtoolbox.com/DNSLookup.aspx

### SSL Checker Tools
- https://www.ssllabs.com/ssltest/
- https://www.sslshopper.com/ssl-checker.html

---

## 🎯 QUICK SETUP COMMANDS

Here's a quick script to set up everything:

```bash
#!/bin/bash
# Magnus Flipper AI - Custom Domain Setup Script

VERCEL_TOKEN="032Q45KOVnOEcP7f4RgwNNNZ"
PROJECT_ID="prj_JWEPz5xWQ1ubp9JOHe7bifQ2IepF"
DOMAIN="api.flipperagents.com"

echo "🚀 Setting up custom domain: $DOMAIN"

# Step 1: Add domain to Vercel
echo "📌 Adding domain to Vercel project..."
curl -X POST \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  "https://api.vercel.com/v10/projects/$PROJECT_ID/domains" \
  -d "{\"name\": \"$DOMAIN\"}" | jq '.'

# Step 2: Wait for DNS propagation
echo "⏳ Waiting for DNS propagation (30 seconds)..."
sleep 30

# Step 3: Check domain verification
echo "🔍 Checking domain verification..."
curl -H "Authorization: Bearer $VERCEL_TOKEN" \
  "https://api.vercel.com/v9/projects/$PROJECT_ID/domains/$DOMAIN" | jq '.'

# Step 4: Test health endpoint
echo "🧪 Testing health endpoint..."
curl -i "https://$DOMAIN/health"

echo "✅ Setup complete! Check output above for any errors."
```

Save this as `setup_custom_domain.sh`, make it executable, and run:
```bash
chmod +x setup_custom_domain.sh
./setup_custom_domain.sh
```

---

**Generated by:** Claude Code - Magnus Flipper AI DevOps Orchestrator
**Last Updated:** 2025-11-09
**Version:** 1.0

🌐 **Your API will be accessible at: https://api.flipperagents.com**
