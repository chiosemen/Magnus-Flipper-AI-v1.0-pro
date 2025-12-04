# Magnus Flipper AI - Operational Runbook Index

## Overview

This is the central index for all operational runbooks and procedures for Magnus Flipper AI. Use this document to navigate to the appropriate runbook for your operational needs.

## Quick Reference

| Situation | Document | Priority |
|-----------|----------|----------|
| System is down | [Incident Response](./incident-response.md) | SEV-1 |
| Need to check health | [Health Checks](./health-checks.md) | - |
| Need to restart service | [Restart and Recovery](./restart-and-recovery.md) | - |
| Investigating issues | [Diagnostics](./diagnostics.md) | - |
| Security incident | [Security Events](./security-events.md) | SEV-1 |
| Preparing deployment | [Deployment Checklist](./deployment-checklist.md) | - |
| Understanding system | [Overview](./overview.md) | - |
| SLO/SLA questions | [SLO/SLA](./slo-sla.md) | - |

## Runbook Documents

### 1. [System Overview](./overview.md)

**Purpose**: High-level understanding of the system architecture and components.

**Contents**:
- What Magnus Flipper AI is
- High-level architecture diagram
- Key services (web, engines, worker, Supabase, Stripe)
- Deployment topology
- Technology stack
- Data flow diagrams
- Quick reference tables

**When to Use**: 
- Onboarding new team members
- Understanding system architecture
- Planning changes or improvements
- Reference for other runbooks

---

### 2. [Incident Response](./incident-response.md)

**Purpose**: Procedures for responding to incidents and outages.

**Contents**:
- Severity levels (SEV-1, SEV-2, SEV-3)
- On-call responsibilities
- Incident triage checklist
- Immediate containment steps
- Communication guidelines
- Post-incident review template
- Escalation procedures

**When to Use**:
- System is down or degraded
- Error rates are high
- Users reporting issues
- Any production incident

**Priority**: **Critical** - Bookmark this for emergencies

---

### 3. [Health Checks](./health-checks.md)

**Purpose**: How to validate system health and diagnose issues.

**Contents**:
- Health endpoint usage
- Dependency health checks (Supabase, Stripe)
- Worker heartbeat verification
- System telemetry access
- Common symptoms and root causes
- Automated monitoring setup
- Troubleshooting checklist

**When to Use**:
- Regular health monitoring
- Pre-deployment verification
- Post-deployment verification
- Investigating system issues
- Setting up monitoring

---

### 4. [Restart and Recovery](./restart-and-recovery.md)

**Purpose**: Step-by-step procedures for restarting services and recovering from failures.

**Contents**:
- Pre-restart health checks
- Web application restart (Vercel)
- Worker restart procedures
- Supabase key reset
- Stripe webhook secret reset
- Cache invalidation
- Database recovery
- Recovery procedures by issue type

**When to Use**:
- Need to restart a service
- Recovering from failures
- Rotating credentials
- Clearing caches
- Restoring from backups

---

### 5. [Diagnostics](./diagnostics.md)

**Purpose**: How to diagnose issues, collect diagnostic information, and troubleshoot problems.

**Contents**:
- Enabling debug logs
- Generating diagnostic bundles
- Inspecting API latency metrics
- Collecting recent errors
- System slowdown investigation
- Diagnostic checklist
- Common diagnostic scenarios

**When to Use**:
- Investigating performance issues
- Collecting diagnostic data
- Debugging errors
- Analyzing system behavior
- Preparing for incident response

---

### 6. [Security Events](./security-events.md)

**Purpose**: Procedures for detecting and responding to security incidents.

**Contents**:
- Detecting suspicious activity
- Stripe webhook failure response
- Token leakage response
- Revoking Supabase service keys
- Revoking Stripe keys
- Session invalidation
- Security event response checklist
- Common security scenarios

**When to Use**:
- Security incident detected
- Token or credential exposure
- Unauthorized access attempts
- Payment processing issues
- Suspicious activity detected

**Priority**: **Critical** - Security incidents require immediate response

---

### 7. [Deployment Checklist](./deployment-checklist.md)

**Purpose**: Comprehensive checklist for safe and successful deployments.

**Contents**:
- Pre-deployment checklist
- Vercel deployment verification
- Supabase environment verification
- Stripe key verification
- EAS build verification
- Deployment steps
- Canary release flow
- Rollback procedures
- Post-deployment verification

**When to Use**:
- Before every deployment
- Preparing for releases
- Verifying deployment readiness
- Post-deployment verification
- Planning rollbacks

---

### 8. [SLO/SLA](./slo-sla.md)

**Purpose**: Service Level Objectives and Agreements definitions and tracking.

**Contents**:
- Availability SLO (99.9%)
- API Latency SLO (P95 < 500ms)
- Error Rate SLO (< 1%)
- Worker Availability SLO (99.5%)
- Error budget policies
- SLO tracking methods
- Escalation triggers
- SLA reporting format

**When to Use**:
- Understanding service commitments
- Tracking SLO compliance
- Reporting on service quality
- Planning improvements
- Error budget management

---

## Operational Workflows

### New Incident Workflow

1. **Assess Severity** → [Incident Response](./incident-response.md)
2. **Check Health** → [Health Checks](./health-checks.md)
3. **Diagnose Issue** → [Diagnostics](./diagnostics.md)
4. **Contain & Resolve** → [Restart and Recovery](./restart-and-recovery.md)
5. **Post-Mortem** → [Incident Response](./incident-response.md)

### Deployment Workflow

1. **Pre-Deployment** → [Deployment Checklist](./deployment-checklist.md)
2. **Deploy** → Vercel/GitHub Actions
3. **Verify Health** → [Health Checks](./health-checks.md)
4. **Monitor** → [Diagnostics](./diagnostics.md)
5. **Rollback if Needed** → [Restart and Recovery](./restart-and-recovery.md)

### Security Incident Workflow

1. **Detect** → [Security Events](./security-events.md)
2. **Assess** → [Security Events](./security-events.md)
3. **Contain** → [Security Events](./security-events.md) + [Restart and Recovery](./restart-and-recovery.md)
4. **Remediate** → [Security Events](./security-events.md)
5. **Document** → [Security Events](./security-events.md)

## Notes for Future Expansion

### Areas for Future Documentation

- **Performance Tuning**: Detailed performance optimization procedures
- **Capacity Planning**: Scaling procedures and resource planning
- **Disaster Recovery**: Full disaster recovery procedures
- **Compliance**: GDPR, SOC2, and other compliance procedures
- **Cost Optimization**: Cost management and optimization strategies
- **Feature Flags**: Feature flag management procedures
- **A/B Testing**: Experimentation and testing procedures

### Maintenance Schedule

- **Monthly**: Review and update all runbooks
- **After Incidents**: Update relevant runbooks with lessons learned
- **After Deployments**: Update deployment checklist if needed
- **Quarterly**: Comprehensive review of all procedures

### Contributing to Runbooks

When updating runbooks:
1. Test procedures in staging/preview first
2. Document any deviations from procedures
3. Update related runbooks if changes affect them
4. Share updates with team
5. Archive old versions if major changes

## Emergency Contacts

### Internal Team

- **Engineering Lead**: `<name>` - `<email>` - `<phone>`
- **CTO/Founder**: `<name>` - `<email>` - `<phone>`
- **On-Call Engineer**: See current on-call schedule

### External Vendors

- **Vercel Support**: https://vercel.com/support
- **Supabase Support**: https://supabase.com/support
- **Stripe Support**: https://support.stripe.com

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-01-15 | Initial runbook creation |

## Related Resources

- **GitHub Repository**: `<repository-url>`
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Supabase Dashboard**: https://supabase.com/dashboard
- **Stripe Dashboard**: https://dashboard.stripe.com
- **Monitoring Dashboard**: `<monitoring-url>` (if applicable)

---

**Last Updated**: 2024-01-15  
**Maintained By**: Engineering Team  
**Review Schedule**: Monthly

