# 🌐 DNS & Domain Mapping Guide
## Magnus Flipper AI Production Domains

**Generated:** November 9, 2025
**Target:** Production Deployment

---

## 📋 Domain Architecture

```
flipperagents.com                 → Marketing site (Vercel)
├── www.flipperagents.com         → Redirect to root
├── app.flipperagents.com         → Web application (Vercel)
└── api.flipperagents.com         → Backend API (Render)
```

---

## 🎯 Quick Setup (Recommended)

### Step 1: Configure api.flipperagents.com

**Method A: CNAME to Render (Recommended)**

```dns
Type:    CNAME
Name:    api
Value:   magnus-flipper-ai-v1-0.onrender.com
TTL:     300 (5 minutes)
Proxy:   No (direct)
```

**Method B: A Record (Alternative)**

```dns
Type:    A
Name:    api
Value:   216.24.57.251
TTL:     300
```

### Step 2: Add Custom Domain in Render

1. Go to: https://dashboard.render.com/web/srv-d47rkeemcj7s73dj61lg
2. Navigate to: Settings → Custom Domains
3. Click: "Add Custom Domain"
4. Enter: `api.flipperagents.com`
5. Click: "Add"
6. Wait for SSL provisioning (5-10 minutes)

### Step 3: Update Environment Variables

**Render (Backend):**
```env
BASE_URL=https://api.flipperagents.com
ALLOWED_ORIGINS=https://flipperagents.com,https://app.flipperagents.com
```

**Vercel (Frontend):**
```env
NEXT_PUBLIC_API_URL=https://api.flipperagents.com/api/v1
```

**Mobile App:**
```env
EXPO_PUBLIC_API_URL=https://api.flipperagents.com/api/v1
EXPO_PUBLIC_SOCKET_URL=wss://api.flipperagents.com/socket
```

### Step 4: Update Stripe Webhook

```
https://api.flipperagents.com/api/v1/webhooks/stripe
```

---

## 🔧 DNS Provider Configurations

### Cloudflare

```bash
# Login to Cloudflare Dashboard
# Select domain: flipperagents.com
# DNS → Add Record

Record Type:   CNAME
Name:          api
Target:        magnus-flipper-ai-v1-0.onrender.com
Proxy Status:  DNS only (grey cloud)
TTL:           Auto
```

**Important:** Use "DNS only" (grey cloud) not "Proxied" (orange cloud) for API subdomain.

### Vercel DNS

```bash
# If using Vercel for DNS
# Dashboard → Domains → flipperagents.com → DNS Records

Type:    CNAME
Name:    api
Value:   magnus-flipper-ai-v1-0.onrender.com
TTL:     60
```

### GoDaddy

```bash
Type:        CNAME
Host:        api
Points to:   magnus-flipper-ai-v1-0.onrender.com
TTL:         600 seconds
```

### Namecheap

```bash
Type:        CNAME Record
Host:        api
Value:       magnus-flipper-ai-v1-0.onrender.com
TTL:         Automatic
```

---

## 🔒 SSL/TLS Certificate Setup

### Automatic (Render Managed)

**Status:** ✅ Included with Render

**Details:**
- Provider: Let's Encrypt
- Type: Domain Validated (DV)
- Renewal: Automatic (every 90 days)
- Wildcard: Not supported
- Cost: Free

**Provisioning Time:**
- Initial: 5-15 minutes
- Renewal: Automatic background process

**Verification:**
```bash
curl -I https://api.flipperagents.com
# Look for: HTTP/2 200
# Certificate info
openssl s_client -connect api.flipperagents.com:443 -servername api.flipperagents.com
```

---

## ✅ Verification Checklist

### DNS Propagation

```bash
# Check DNS resolution
dig api.flipperagents.com

# Expected output:
# api.flipperagents.com.  300  IN  CNAME  magnus-flipper-ai-v1-0.onrender.com.

# Check from multiple locations
https://www.whatsmydns.net/#CNAME/api.flipperagents.com
```

### SSL Certificate

```bash
# Test HTTPS
curl -I https://api.flipperagents.com

# Expected:
# HTTP/2 200 OK
# strict-transport-security: max-age=...

# Check certificate
curl -vI https://api.flipperagents.com 2>&1 | grep -i "subject\|issuer"
```

### Health Check

```bash
# Test API health endpoint
curl https://api.flipperagents.com/health

# Expected response:
{
  "status": "ok",
  "timestamp": "2025-11-09T...",
  "uptime": 123.45
}
```

### Full API Test

```bash
# Test main API endpoint
curl https://api.flipperagents.com/api/v1/deals

# Test with auth (if required)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://api.flipperagents.com/api/v1/profile
```

---

## ⏱️ DNS Propagation Timeline

| Phase | Duration | Description |
|-------|----------|-------------|
| **Local DNS** | 0-5 min | Your DNS resolver |
| **ISP DNS** | 5-30 min | Internet Service Provider |
| **Global** | 1-4 hours | Worldwide propagation |
| **Complete** | 24-48 hours | All DNS servers updated |

**Tip:** Use low TTL (300s) during setup, increase to 3600s (1 hour) when stable.

---

## 🚨 Troubleshooting

### Issue: DNS Not Resolving

**Symptoms:**
```bash
$ dig api.flipperagents.com
# Returns NXDOMAIN or no records
```

**Solutions:**
1. Verify DNS record created correctly
2. Check TTL hasn't expired yet
3. Try flushing local DNS cache:
   ```bash
   # macOS
   sudo dscacheutil -flushcache
   sudo killall -HUP mDNSResponder

   # Windows
   ipconfig /flushdns

   # Linux
   sudo systemd-resolve --flush-caches
   ```

### Issue: SSL Certificate Not Provisioning

**Symptoms:**
- Browser shows "Not Secure"
- `curl` returns SSL error

**Solutions:**
1. Wait 15 minutes (initial provisioning time)
2. Verify DNS is resolving correctly
3. Check Render Dashboard → Custom Domains for status
4. Ensure CNAME points to correct Render URL
5. Contact Render support if stuck after 1 hour

### Issue: 502 Bad Gateway

**Symptoms:**
```bash
$ curl https://api.flipperagents.com
HTTP/2 502
```

**Solutions:**
1. Check Render Dashboard → Logs
2. Verify application is running
3. Check environment variables configured
4. Test health endpoint
5. Review application startup logs

---

## 📊 Performance Optimization

### Cloudflare CDN (Optional)

If you want CDN caching:

```bash
# Set Cloudflare proxy to "Proxied" (orange cloud)
# Configure cache rules:

Page Rules:
  api.flipperagents.com/api/v1/deals/*
  → Cache Level: Cache Everything
  → Edge Cache TTL: 5 minutes

  api.flipperagents.com/api/*
  → Cache Level: Bypass
```

**Note:** Be careful with caching authenticated endpoints.

---

## 🔄 Rollback Plan

If something goes wrong:

### Quick Rollback

```bash
# Option 1: Revert DNS to Render subdomain
Type:    CNAME
Name:    api-temp
Value:   magnus-flipper-ai-v1-0.onrender.com

# Update all references to:
# https://api-temp.flipperagents.com
```

### Emergency Rollback

```bash
# Point to old infrastructure (if exists)
Type:    CNAME
Name:    api
Value:   old-api-server.provider.com
```

---

## 📝 Post-Setup Checklist

- [ ] DNS CNAME record created
- [ ] DNS propagation verified
- [ ] Custom domain added in Render
- [ ] SSL certificate provisioned
- [ ] HTTPS working correctly
- [ ] Health endpoint responding
- [ ] API endpoints accessible
- [ ] Frontend updated with new URL
- [ ] Mobile app updated with new URL
- [ ] Stripe webhook updated
- [ ] Environment variables updated
- [ ] CORS origins updated
- [ ] Full integration test passed

---

## 📚 Additional Resources

- [Render Custom Domains Docs](https://render.com/docs/custom-domains)
- [SSL/TLS Best Practices](https://render.com/docs/tls)
- [DNS Configuration Guide](https://render.com/docs/configure-dns)
- [Cloudflare DNS Setup](https://developers.cloudflare.com/dns/)

---

**Status:** Ready for configuration
**Estimated Setup Time:** 30 minutes + DNS propagation (1-4 hours)
**Difficulty:** Medium
