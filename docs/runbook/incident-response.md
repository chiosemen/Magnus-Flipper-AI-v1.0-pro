# Incident Response Runbook

## Severity Levels

### SEV-1: Critical (Immediate Response Required)

**Definition**: Complete service outage or data loss affecting all users.

**Examples**:
- Web application completely unavailable
- Database connection failure
- Payment processing completely down
- Security breach or data leak

**Response Time**: Immediate (within 15 minutes)  
**Resolution Target**: 1 hour  
**Escalation**: Immediate escalation to engineering lead

### SEV-2: High (Urgent Response)

**Definition**: Significant degradation affecting majority of users or critical features.

**Examples**:
- 50%+ of API requests failing
- Payment processing degraded (some failures)
- Worker processes down (no job processing)
- Critical feature unavailable (e.g., deal scoring)

**Response Time**: Within 30 minutes  
**Resolution Target**: 4 hours  
**Escalation**: Escalate if not resolved within 2 hours

### SEV-3: Medium (Standard Response)

**Definition**: Partial degradation affecting subset of users or non-critical features.

**Examples**:
- Some API endpoints slow (>2s response time)
- Non-critical features unavailable
- Worker processes degraded (some jobs failing)
- Minor UI issues

**Response Time**: Within 2 hours  
**Resolution Target**: 24 hours  
**Escalation**: Escalate if not resolved within 12 hours

## On-Call Responsibilities

### Primary On-Call Engineer

**Responsibilities**:
1. Monitor alerts and health checks
2. Triage incoming incidents
3. Execute incident response procedures
4. Communicate status updates
5. Document incident timeline
6. Escalate when necessary

**Tools Access Required**:
- Vercel dashboard access
- Supabase dashboard access
- Stripe dashboard access
- GitHub repository access
- Application logs access

### Escalation Chain

1. **Primary On-Call** → Triage and initial response
2. **Engineering Lead** → SEV-1 incidents, complex issues
3. **CTO/Founder** → Critical business impact, security breaches

## Incident Triage Checklist

### Initial Assessment (First 5 minutes)

- [ ] **Determine Severity**: Classify as SEV-1, SEV-2, or SEV-3
- [ ] **Check Health Endpoint**: `GET /api/health`
- [ ] **Check System Telemetry**: `GET /api/system/telemetry` (if accessible)
- [ ] **Review Recent Alerts**: Check observability alerts
- [ ] **Check External Services**: Verify Supabase and Stripe status pages
- [ ] **Identify Affected Users**: Estimate user impact
- [ ] **Document Initial Symptoms**: Record what's observed

### Information Gathering (Next 10 minutes)

- [ ] **Check Application Logs**: Review recent error logs
- [ ] **Check Worker Status**: Verify worker heartbeat
- [ ] **Check Database Connectivity**: Test Supabase connection
- [ ] **Check Payment Processing**: Verify Stripe connectivity
- [ ] **Review Recent Deployments**: Check if recent changes correlate
- [ ] **Check Error Rates**: Review metrics for spikes
- [ ] **Identify Error Patterns**: Look for common error messages

### Communication (Ongoing)

- [ ] **Create Incident Channel**: Set up communication channel (Slack, etc.)
- [ ] **Post Initial Status**: Share severity and initial assessment
- [ ] **Set Update Schedule**: Commit to regular updates (every 30 min for SEV-1)
- [ ] **Notify Stakeholders**: Alert relevant team members
- [ ] **Update Status Page**: If public status page exists

## Immediate Containment Steps

### For Complete Service Outage (SEV-1)

1. **Verify Scope**
   ```bash
   curl https://magnusflipper.com/api/health
   ```

2. **Check Vercel Status**
   - Visit: https://vercel.com/status
   - Check deployment status in Vercel dashboard

3. **Check Supabase Status**
   - Visit: https://status.supabase.com
   - Test database connection

4. **Check Stripe Status**
   - Visit: https://status.stripe.com
   - Verify API key validity

5. **Review Recent Deployments**
   - Check Vercel deployment history
   - Identify last successful deployment

6. **Rollback if Needed**
   - If recent deployment caused issue, rollback immediately
   - See [Restart and Recovery](./restart-and-recovery.md) for rollback steps

### For API Degradation (SEV-2)

1. **Identify Affected Routes**
   ```bash
   # Check telemetry endpoint (admin access required)
   curl -H "Authorization: Bearer <token>" \
     https://magnusflipper.com/api/system/telemetry
   ```

2. **Check Error Rates**
   - Review error counts by route
   - Identify routes with high failure rates

3. **Check Database Performance**
   - Review Supabase query performance
   - Check for slow queries or connection pool exhaustion

4. **Check Rate Limiting**
   - Verify rate limits aren't too aggressive
   - Check for DDoS or abuse patterns

5. **Temporary Mitigation**
   - Increase rate limits if needed
   - Disable non-critical features if necessary
   - Scale up resources if possible

### For Worker Failures (SEV-2)

1. **Check Worker Heartbeat**
   ```sql
   -- Query Supabase directly
   SELECT * FROM worker_heartbeat 
   ORDER BY last_heartbeat DESC;
   ```

2. **Check Job Queue**
   ```sql
   SELECT status, COUNT(*) 
   FROM job_queue 
   GROUP BY status;
   ```

3. **Restart Workers**
   - See [Restart and Recovery](./restart-and-recovery.md)

4. **Clear Stuck Jobs**
   - Identify stuck jobs in queue
   - Manually update status if needed

### For Payment Issues (SEV-1 or SEV-2)

1. **Check Stripe Dashboard**
   - Verify API keys are valid
   - Check webhook delivery status
   - Review recent payment failures

2. **Test Webhook Endpoint**
   ```bash
   curl -X POST https://magnusflipper.com/api/stripe/webhook \
     -H "stripe-signature: <test-signature>"
   ```

3. **Verify Webhook Secret**
   - Ensure `STRIPE_WEBHOOK_SECRET` is correct
   - Check webhook configuration in Stripe dashboard

4. **Manual Subscription Updates**
   - If webhooks are failing, manually update subscriptions
   - Use Stripe dashboard to verify subscription status

## Communication Guidelines

### Status Update Template

```
[INCIDENT] <Severity> - <Brief Description>

Status: <Investigating / Identified / Mitigating / Resolved>
Time Started: <timestamp>
Affected: <users/features>
Impact: <description>

Current Actions:
- <action 1>
- <action 2>

Next Update: <time>
```

### Update Frequency

- **SEV-1**: Every 15-30 minutes
- **SEV-2**: Every 1 hour
- **SEV-3**: Every 2-4 hours

### Communication Channels

1. **Internal Team**: Slack/Teams channel
2. **Stakeholders**: Email or direct message
3. **Users**: Status page or in-app notification (if applicable)
4. **Public**: Status page (if public-facing)

## Post-Incident Review Template

### Incident Summary

**Incident ID**: `INC-YYYY-MM-DD-XXX`  
**Severity**: SEV-1 / SEV-2 / SEV-3  
**Start Time**: `YYYY-MM-DD HH:MM:SS UTC`  
**End Time**: `YYYY-MM-DD HH:MM:SS UTC`  
**Duration**: `X hours Y minutes`  
**Reported By**: `<name>`  
**Resolved By**: `<name>`

### Timeline

| Time | Event | Action Taken |
|------|-------|--------------|
| HH:MM | Initial detection | <description> |
| HH:MM | Triage completed | <description> |
| HH:MM | Root cause identified | <description> |
| HH:MM | Mitigation applied | <description> |
| HH:MM | Service restored | <description> |

### Root Cause

**Primary Cause**: `<description>`

**Contributing Factors**:
- Factor 1
- Factor 2

**Technical Details**:
- Error messages
- Log excerpts
- Metrics data

### Impact Assessment

**Users Affected**: `<number or percentage>`

**Features Affected**:
- Feature 1: `<impact description>`
- Feature 2: `<impact description>`

**Business Impact**:
- Revenue impact (if applicable)
- User trust impact
- Reputation impact

### Resolution Steps

1. Step 1: `<description>`
2. Step 2: `<description>`
3. Step 3: `<description>`

### Action Items

**Immediate (Within 24 hours)**:
- [ ] Action item 1
- [ ] Action item 2

**Short-term (Within 1 week)**:
- [ ] Action item 3
- [ ] Action item 4

**Long-term (Within 1 month)**:
- [ ] Action item 5
- [ ] Action item 6

### Lessons Learned

**What Went Well**:
- Positive aspect 1
- Positive aspect 2

**What Could Be Improved**:
- Improvement 1
- Improvement 2

**Prevention Measures**:
- Measure 1: `<description>`
- Measure 2: `<description>`

### Follow-up

**Owner**: `<name>`  
**Due Date**: `YYYY-MM-DD`  
**Status**: `<In Progress / Completed>`

## Escalation Triggers

### Automatic Escalation

- **SEV-1 incidents** not acknowledged within 15 minutes
- **SEV-2 incidents** not resolved within 2 hours
- **Security-related incidents** (immediate escalation)
- **Data loss incidents** (immediate escalation)

### Manual Escalation Criteria

- On-call engineer needs additional expertise
- Incident requires business decision
- Resource constraints preventing resolution
- External vendor involvement needed

## Emergency Contacts

### Internal Team

- **Engineering Lead**: `<name>` - `<email>` - `<phone>`
- **CTO/Founder**: `<name>` - `<email>` - `<phone>`
- **DevOps**: `<name>` - `<email>` - `<phone>`

### External Vendors

- **Vercel Support**: https://vercel.com/support
- **Supabase Support**: https://supabase.com/support
- **Stripe Support**: https://support.stripe.com

### On-Call Schedule

- **Current Week**: `<name>` - `<contact>`
- **Next Week**: `<name>` - `<contact>`

## Related Documents

- [Health Checks](./health-checks.md) - How to verify system health
- [Restart and Recovery](./restart-and-recovery.md) - Recovery procedures
- [Diagnostics](./diagnostics.md) - Diagnostic procedures
- [Security Events](./security-events.md) - Security incident handling

