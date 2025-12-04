# DNS Setup Guide for flipperagents.com

## Overview

This guide covers DNS configuration for Magnus Flipper AI production deployment on **flipperagents.com**.

---

## DNS Records for Vercel (Primary Domain)

Add these records in your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.):

### Primary Domain Records

```
Type    Name    Value                           TTL     Priority
A       @       76.76.21.21                     3600    -
A       @       76.76.19.19                     3600    -
AAAA    @       2606:4700:10::6814:df5         3600    -
AAAA    @       2606:4700:10::6814:ef5         3600    -
CNAME   www     cname.vercel-dns.com.          3600    -
```

### Verification Record

Vercel will provide a verification TXT record. Add it:

```
Type    Name    Value                                           TTL
TXT     @       verification=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx   3600
```

**To get your verification code:**
1. Go to Vercel Dashboard
2. Project Settings > Domains
3. Add `flipperagents.com`
4. Copy the TXT verification record
5. Add to your DNS provider
6. Click "Verify" in Vercel

---

## Email Configuration (Optional)

If you want to use email with your domain:

### Google Workspace / Gmail

```
Type    Name    Value                   TTL     Priority
MX      @       aspmx.l.google.com      3600    1
MX      @       alt1.aspmx.l.google.com 3600    5
MX      @       alt2.aspmx.l.google.com 3600    5
MX      @       alt3.aspmx.l.google.com 3600    10
MX      @       alt4.aspmx.l.google.com 3600    10
```

### SendGrid / Mailgun (Transactional Email)

```
Type    Name    Value                           TTL
CNAME   em      u12345.wl.sendgrid.net         3600
CNAME   s1._domainkey  s1.domainkey.u12345.wl.sendgrid.net  3600
CNAME   s2._domainkey  s2.domainkey.u12345.wl.sendgrid.net  3600
```

---

## Subdomains (Optional)

### API Subdomain (Azure Functions)

If you want `api.flipperagents.com`:

```
Type    Name    Value                                           TTL
CNAME   api     magnus-flipper-workers-prod.azurewebsites.net  3600
```

### Admin Panel Subdomain

If you want `admin.flipperagents.com`:

```
Type    Name    Value                   TTL
CNAME   admin   cname.vercel-dns.com   3600
```

Then in Vercel:
1. Add domain `admin.flipperagents.com`
2. Configure to point to admin routes

---

## SSL Configuration

### Vercel SSL (Automatic)

Vercel automatically provisions SSL certificates via Let's Encrypt when:
1. DNS records are properly configured
2. Domain is verified
3. Propagation is complete (5-60 minutes)

**Check SSL status:**
- Vercel Dashboard > Domains > flipperagents.com > SSL

### Azure Functions SSL

If using custom domain on Azure:

```bash
# Add custom domain
az functionapp config hostname add \
  --webapp-name magnus-flipper-workers-prod \
  --resource-group magnus-flipper-production-rg \
  --hostname api.flipperagents.com

# Bind SSL (managed certificate)
az functionapp config ssl create \
  --resource-group magnus-flipper-production-rg \
  --name magnus-flipper-workers-prod \
  --hostname api.flipperagents.com
```

---

## DNS Provider-Specific Instructions

### Cloudflare

1. Log in to Cloudflare Dashboard
2. Select `flipperagents.com`
3. Go to DNS > Records
4. Add records as shown above
5. **Important:** Set proxy status to "DNS only" (grey cloud) for:
   - Vercel A/AAAA records
   - Vercel CNAME records
6. For SSL, use "Full" mode in SSL/TLS settings

### GoDaddy

1. Log in to GoDaddy
2. My Products > Domains > flipperagents.com > Manage DNS
3. Add records using the DNS management interface
4. Remove default parking page records (usually `@` A record to parking IP)

### Namecheap

1. Log in to Namecheap
2. Domain List > Manage > Advanced DNS
3. Add records in the "Host Records" section
4. Turn off URL Redirect if enabled

### Google Domains

1. Log in to Google Domains
2. My domains > flipperagents.com > DNS
3. Use "Custom name servers" or "Custom records"
4. Add records as listed above

---

## DNS Propagation

After adding DNS records, propagation can take **5 minutes to 48 hours**.

### Check Propagation

**Online Tools:**
- https://www.whatsmydns.net/
- https://dnschecker.org/

**Command Line:**
```bash
# Check A record
dig flipperagents.com A +short

# Check CNAME record
dig www.flipperagents.com CNAME +short

# Check from specific DNS server
dig @8.8.8.8 flipperagents.com A +short
```

**Expected Results:**
```bash
$ dig flipperagents.com A +short
76.76.21.21
76.76.19.19

$ dig www.flipperagents.com CNAME +short
cname.vercel-dns.com.
```

---

## Verification Checklist

- [ ] A records point to Vercel IPs
- [ ] CNAME for www points to Vercel
- [ ] TXT verification record added
- [ ] DNS propagation complete (check whatsmydns.net)
- [ ] Domain verified in Vercel Dashboard
- [ ] SSL certificate issued (green lock in browser)
- [ ] https://flipperagents.com loads correctly
- [ ] https://www.flipperagents.com redirects to non-www (or vice versa)
- [ ] All pages accessible via HTTPS

---

## Troubleshooting

### Domain Not Resolving

**Issue:** `flipperagents.com` doesn't load

**Solutions:**
1. Verify DNS records are correct
2. Check propagation status: https://www.whatsmydns.net/
3. Clear browser cache: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
4. Flush DNS cache:
   ```bash
   # macOS
   sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder

   # Windows
   ipconfig /flushdns

   # Linux
   sudo systemd-resolve --flush-caches
   ```

### SSL Certificate Issues

**Issue:** "Your connection is not private" error

**Solutions:**
1. Wait for SSL provisioning (can take up to 24 hours)
2. Check Vercel Dashboard > Domains > SSL status
3. Ensure DNS records are correct
4. Try force SSL renewal in Vercel Dashboard

### www Subdomain Not Working

**Issue:** `www.flipperagents.com` doesn't resolve

**Solutions:**
1. Verify CNAME record for `www` is present
2. Check if www is added as a domain in Vercel
3. Ensure propagation is complete

### Mixed Content Warnings

**Issue:** Site loads but shows "Not Secure" in some browsers

**Solutions:**
1. Ensure all assets use HTTPS URLs
2. Check for hardcoded HTTP links in code
3. Update Next.js config to enforce HTTPS:
   ```js
   // next.config.js
   async headers() {
     return [
       {
         source: '/:path*',
         headers: [
           {
             key: 'Strict-Transport-Security',
             value: 'max-age=31536000; includeSubDomains'
           }
         ]
       }
     ]
   }
   ```

---

## Custom Email Setup

### Using SendGrid

1. Sign up for SendGrid
2. Verify domain `flipperagents.com`
3. Add DNS records provided by SendGrid
4. Update environment variables:
   ```bash
   SENDGRID_API_KEY=your_api_key
   EMAIL_FROM=noreply@flipperagents.com
   ```

### Using AWS SES

1. Verify domain in AWS SES
2. Add TXT, CNAME, MX records provided by SES
3. Update environment variables:
   ```bash
   AWS_SES_REGION=us-east-1
   AWS_SES_ACCESS_KEY=your_key
   AWS_SES_SECRET_KEY=your_secret
   ```

---

## Post-DNS Setup

After DNS is configured and propagated:

1. **Update Environment Variables**
   ```bash
   # In Vercel
   NEXT_PUBLIC_APP_URL=https://flipperagents.com

   # In Azure Functions
   CORS_ALLOWED_ORIGINS=https://flipperagents.com
   ```

2. **Update Stripe Webhook URL**
   - Go to Stripe Dashboard > Developers > Webhooks
   - Update endpoint to: `https://flipperagents.com/api/webhooks/stripe`

3. **Update Supabase Redirect URLs**
   - Go to Supabase Dashboard > Authentication > URL Configuration
   - Site URL: `https://flipperagents.com`
   - Redirect URLs:
     - `https://flipperagents.com/auth/callback`
     - `https://www.flipperagents.com/auth/callback`

4. **Test Full Flow**
   - Visit https://flipperagents.com
   - Sign up for account
   - Test payment flow
   - Verify worker jobs execute

---

## DNS Record Summary

**Complete DNS Configuration:**

```
# Primary domain (Vercel)
A       @       76.76.21.21                                 3600
A       @       76.76.19.19                                 3600
CNAME   www     cname.vercel-dns.com.                      3600

# Verification
TXT     @       verification=YOUR_VERCEL_CODE              3600

# Optional: API subdomain (Azure)
CNAME   api     magnus-flipper-workers-prod.azurewebsites.net  3600

# Optional: Email (SendGrid example)
CNAME   em      u12345.wl.sendgrid.net                     3600
CNAME   s1._domainkey  s1.domainkey.u12345.wl.sendgrid.net  3600
```

---

**DNS Setup Complete!**

Your domain should now be fully configured and accessible at https://flipperagents.com
