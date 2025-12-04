# Security Events Runbook

## Overview

This document describes procedures for detecting and responding to security incidents.

## Detecting Suspicious Activity

### Indicators of Compromise

**Unusual API Activity**:
- Sudden spike in API requests
- Requests from unusual IP addresses
- High rate of authentication failures
- Unusual access patterns

**Unusual User Activity**:
- Multiple failed login attempts
- Access from unusual locations
- Unusual subscription changes
- Admin access from non-admin accounts

**System Anomalies**:
- Unexpected error spikes
- Unusual database queries
- Unexpected environment variable access
- Unauthorized configuration changes

### Monitoring Tools

**Review Error Logs**:
```bash
# Check for authentication errors
grep "auth" /path/to/logs | grep "error"

# Check for unauthorized access attempts
grep "unauthorized" /path/to/logs
```

**Review API Metrics**:
```typescript
import { getAllMetrics } from '@/lib/observability/metrics';

const metrics = getAllMetrics();
// Check for unusual error rates
const errorRate = metrics.counters['api.auth.failure'] / 
  (metrics.counters['api.auth.success'] + metrics.counters['api.auth.failure']);
```

**Review Alerts**:
```typescript
import { getRecentAlerts } from '@/lib/observability/alerts';

const alerts = getRecentAlerts(100);
const securityAlerts = alerts.filter(a => 
  a.message.includes('unauthorized') || 
  a.message.includes('authentication') ||
  a.severity === 'critical'
);
```

## Stripe Webhook Failures

### Detection

**Check Webhook Delivery Status**:

1. **Stripe Dashboard**
   - Go to: Developers → Webhooks
   - Click on webhook endpoint
   - Review "Recent deliveries"
   - Check for failed deliveries

2. **Application Logs**
   ```bash
   # Check for webhook signature verification failures
   grep "webhook" /path/to/logs | grep "error"
   ```

3. **Health Endpoint**
   ```bash
   curl https://magnusflipper.com/api/health
   # Check if stripe status is "degraded" or "down"
   ```

### Response Procedure

1. **Verify Webhook Secret**
   - Check `STRIPE_WEBHOOK_SECRET` in Vercel
   - Verify matches Stripe dashboard
   - Ensure no accidental exposure

2. **Test Webhook Endpoint**
   ```bash
   # Use Stripe CLI to test
   stripe listen --forward-to https://magnusflipper.com/api/stripe/webhook
   stripe trigger payment_intent.succeeded
   ```

3. **Check Webhook Configuration**
   - Verify webhook URL is correct
   - Check enabled events
   - Verify signing secret

4. **Manual Subscription Sync** (if needed)
   ```sql
   -- Manually update subscriptions if webhooks failed
   -- (Use with caution, verify with Stripe dashboard first)
   UPDATE user_subscriptions 
   SET status = 'active' 
   WHERE stripe_subscription_id = '<subscription-id>';
   ```

5. **Regenerate Webhook Secret** (if compromised)
   - See [Restart and Recovery](./restart-and-recovery.md) for procedure

### Prevention

- Regularly monitor webhook delivery status
- Set up alerts for webhook failures
- Rotate webhook secrets periodically
- Use webhook signature verification (already implemented)

## Token Leakage

### Detection

**Signs of Token Leakage**:
- Unusual API usage from unknown sources
- Tokens appearing in logs or error messages
- Tokens in version control (GitHub)
- Tokens in client-side code
- Unauthorized access to resources

### Immediate Response

1. **Identify Leaked Token Type**
   - Supabase service role key
   - Stripe secret key
   - API keys
   - Session tokens

2. **Revoke Compromised Tokens**
   - See procedures below for each token type

3. **Rotate All Related Keys**
   - Generate new keys
   - Update environment variables
   - Redeploy services

4. **Audit Access Logs**
   - Review access logs for unauthorized usage
   - Identify scope of compromise
   - Document all affected resources

5. **Notify Affected Users** (if applicable)
   - If user data was accessed
   - If payment information was exposed
   - Follow data breach notification requirements

### Revoking Supabase Service Role Key

1. **Generate New Key**
   - Go to Supabase Dashboard
   - Navigate to: Project Settings → API
   - Click "Reset" next to service_role key
   - Copy new key immediately

2. **Update All Services**
   - Update `SUPABASE_SERVICE_ROLE_KEY` in Vercel
   - Update worker environment variables
   - Update any other services

3. **Redeploy Immediately**
   - Redeploy web application
   - Restart workers
   - Verify services reconnect

4. **Monitor for Issues**
   - Check health endpoint
   - Review error logs
   - Verify functionality

### Revoking Stripe Secret Key

1. **Generate New Key**
   - Go to Stripe Dashboard
   - Navigate to: Developers → API keys
   - Click "Roll key" next to secret key
   - Copy new key immediately

2. **Update Environment Variables**
   - Update `STRIPE_SECRET_KEY` in Vercel
   - Update worker environment (if applicable)

3. **Update Webhook Secret** (if needed)
   - Regenerate webhook signing secret
   - Update `STRIPE_WEBHOOK_SECRET`

4. **Redeploy Services**
   - Redeploy web application
   - Restart workers
   - Test payment processing

### Revoking API Keys

1. **Identify All Uses**
   - Check all environment variables
   - Review codebase for hardcoded keys
   - Check external service configurations

2. **Generate New Keys**
   - Create new keys in respective services
   - Ensure old keys are disabled

3. **Update Configuration**
   - Update all environment variables
   - Remove from version control (if present)
   - Update documentation

4. **Redeploy**
   - Redeploy all affected services
   - Verify functionality

## Session Invalidation

### Manual Session Invalidation

**For Specific User**:

1. **Supabase Dashboard**
   - Go to: Authentication → Users
   - Find user
   - Click "Sign out user" or delete session

2. **Database Query** (if needed)
   ```sql
   -- Invalidate user sessions
   -- (Supabase handles this automatically, but can be done manually)
   DELETE FROM auth.sessions 
   WHERE user_id = '<user-id>';
   ```

### Bulk Session Invalidation

**For Security Incident**:

1. **Invalidate All Sessions**
   ```sql
   -- WARNING: This logs out all users
   -- Use only in security emergencies
   DELETE FROM auth.sessions;
   ```

2. **Force Password Reset** (if needed)
   - Use Supabase Auth API
   - Send password reset emails
   - Require users to set new passwords

3. **Notify Users**
   - Send security notification
   - Explain reason for logout
   - Provide security recommendations

## Security Event Response Checklist

### Immediate Actions (First 15 minutes)

- [ ] **Assess Severity**: Determine if SEV-1 (critical security incident)
- [ ] **Contain Threat**: Revoke compromised credentials
- [ ] **Document Incident**: Record what happened, when, and scope
- [ ] **Notify Team**: Alert security team and engineering lead
- [ ] **Preserve Evidence**: Save logs, metrics, and diagnostic data

### Investigation (Next 1-2 hours)

- [ ] **Identify Compromise Scope**: What was accessed?
- [ ] **Review Access Logs**: Check for unauthorized access
- [ ] **Audit Configuration**: Verify no other keys exposed
- [ ] **Check Data Access**: Review database access logs
- [ ] **Review Code Changes**: Check for malicious code

### Remediation (Next 2-4 hours)

- [ ] **Rotate All Keys**: Generate new credentials
- [ ] **Update Environment Variables**: Deploy new keys
- [ ] **Invalidate Sessions**: Force re-authentication
- [ ] **Patch Vulnerabilities**: Fix any security issues
- [ ] **Update Security Controls**: Strengthen defenses

### Post-Incident (Next 24-48 hours)

- [ ] **Conduct Post-Mortem**: Review incident
- [ ] **Update Procedures**: Improve response procedures
- [ ] **Notify Affected Parties**: If user data compromised
- [ ] **Document Lessons Learned**: Update runbook
- [ ] **Implement Prevention**: Add monitoring/alerting

## Common Security Scenarios

### Scenario: API Key in GitHub

1. **Immediate Actions**:
   - Remove key from repository (if still present)
   - Revoke exposed key immediately
   - Generate new key
   - Update environment variables

2. **Investigation**:
   - Check Git history for exposure duration
   - Review who had access to repository
   - Check for unauthorized usage

3. **Prevention**:
   - Add `.env` files to `.gitignore`
   - Use GitHub Secrets for CI/CD
   - Implement pre-commit hooks
   - Regular security audits

### Scenario: Unauthorized Admin Access

1. **Immediate Actions**:
   - Revoke admin access
   - Invalidate user sessions
   - Review admin access logs
   - Check for data exfiltration

2. **Investigation**:
   - Review access logs
   - Check what data was accessed
   - Identify how access was gained
   - Review authentication logs

3. **Remediation**:
   - Strengthen admin authentication
   - Implement MFA (if not present)
   - Review RLS policies
   - Audit admin user list

### Scenario: DDoS or Rate Limit Abuse

1. **Immediate Actions**:
   - Enable rate limiting (if not already)
   - Block malicious IP addresses
   - Scale up resources (if needed)
   - Enable DDoS protection

2. **Investigation**:
   - Identify attack patterns
   - Review rate limit logs
   - Check for bot activity
   - Analyze traffic patterns

3. **Remediation**:
   - Adjust rate limits
   - Implement IP whitelisting (if applicable)
   - Enable CDN protection
   - Monitor for continued attacks

## Security Monitoring

### Recommended Alerts

1. **Authentication Failures**
   - Alert if > 10 failures in 5 minutes
   - Alert if > 50 failures in 1 hour

2. **Unauthorized Access Attempts**
   - Alert on any unauthorized admin access attempt
   - Alert on repeated unauthorized API calls

3. **Unusual API Activity**
   - Alert if API request rate > 2x normal
   - Alert if error rate > 10%

4. **Token Exposure**
   - Alert if tokens appear in logs
   - Alert if keys accessed from unusual locations

### Security Logging

All security-relevant events are logged:

- Authentication attempts (success/failure)
- Authorization checks
- Admin access
- Payment processing
- Configuration changes
- Error conditions

Logs include:
- Timestamp
- User ID (if applicable)
- IP address
- Action performed
- Success/failure status

## Compliance and Reporting

### Data Breach Notification

If user data is compromised:

1. **Assess Impact**: Determine what data was accessed
2. **Notify Authorities**: If required by law (GDPR, etc.)
3. **Notify Users**: Inform affected users
4. **Document Incident**: Maintain detailed records

### Security Audit Trail

Maintain records of:
- Security incidents
- Response actions taken
- Remediation steps
- Prevention measures implemented

## Related Documents

- [Incident Response](./incident-response.md) - General incident handling
- [Restart and Recovery](./restart-and-recovery.md) - Key rotation procedures
- [Health Checks](./health-checks.md) - System health verification

