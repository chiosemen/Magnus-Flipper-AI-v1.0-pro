# Magnus Operator Agent - Deployment Checklist

**Date:** December 23, 2025  
**Version:** 1.0.0  
**Status:** Ready for Production

---

## Pre-Deployment Checklist

### 1. Database Setup

#### Supabase Migrations
- [ ] Run migration: `20260008_00_operator_agent_tables.sql`
- [ ] Verify tables created:
  - [ ] `scrape_anomalies`
  - [ ] `scrape_runs`
  - [ ] `resolver_decisions`
  - [ ] `marketplace_control`
  - [ ] `operator_change_requests`
  - [ ] `operator_kb_documents`
  - [ ] `operator_kb_chunks`
- [ ] Verify `pgvector` extension enabled
- [ ] Verify indexes created
- [ ] Verify RLS policies active

#### RLS Verification
```sql
-- Test admin access (should return rows)
SELECT COUNT(*) FROM scrape_anomalies;

-- Test as non-admin (should return 0 or error)
SELECT COUNT(*) FROM scrape_anomalies;
```

#### Vector Search Function
- [ ] Create RPC function `search_kb_chunks`:

```sql
CREATE OR REPLACE FUNCTION search_kb_chunks(
  query_embedding vector(1536),
  match_count int DEFAULT 5,
  match_threshold float DEFAULT 0.7
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  chunk_index int,
  content text,
  similarity float,
  metadata jsonb
)
LANGUAGE sql STABLE
AS $$
  SELECT
    id,
    document_id,
    chunk_index,
    content,
    1 - (embedding <=> query_embedding) AS similarity,
    metadata
  FROM operator_kb_chunks
  WHERE 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;
```

---

### 2. Environment Variables

#### Required Variables
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Service role key (secret)
- [ ] `OPENAI_API_KEY` - OpenAI API key (for embeddings + reasoning)

#### Optional Variables (Multi-Provider AI)
- [ ] `ANTHROPIC_API_KEY` - Claude API key (optional)
- [ ] `DEEPSEEK_API_KEY` - DeepSeek API key (optional)

#### Operator Configuration (Optional)
- [ ] `OPERATOR_AI_PROVIDER` - Default: `openai` (options: `openai`, `anthropic`, `deepseek`)
- [ ] `OPERATOR_AI_MODEL` - Default: `gpt-4o-mini`
- [ ] `OPERATOR_RAG_ENABLED` - Default: `true`
- [ ] `OPERATOR_RAG_CHUNK_LIMIT` - Default: `5`
- [ ] `OPERATOR_RAG_THRESHOLD` - Default: `0.7`

#### Verify Environment
```bash
# Check all required variables are set
echo $NEXT_PUBLIC_SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY
echo $OPENAI_API_KEY
```

---

### 3. Knowledge Base Ingestion

#### Seed Documents
- [ ] Run seed script: `packages/operator-kb/scripts/seed.ts`

```bash
cd packages/operator-kb
pnpm run seed
```

#### Verify Ingestion
```sql
-- Check documents
SELECT COUNT(*) FROM operator_kb_documents;

-- Check chunks
SELECT COUNT(*) FROM operator_kb_chunks;

-- Check embeddings
SELECT COUNT(*) FROM operator_kb_chunks WHERE embedding IS NOT NULL;
```

#### Documents to Ingest
- [ ] `PHASE_1_IMPLEMENTATION_SUMMARY.md`
- [ ] `DEPLOYMENT_READINESS_REPORT.md`
- [ ] `docs/runbooks/anomalies.md`
- [ ] `docs/runbooks/marketplace-degraded.md`
- [ ] `docs/runbooks/source-fallback.md`
- [ ] `docs/runbooks/facebook-noise-filtering.md`
- [ ] `docs/runbooks/craigslist-selector-rehab.md`

---

### 4. Admin User Setup

#### Create Admin User
```sql
-- Option 1: Update existing user
UPDATE auth.users
SET raw_app_meta_data = jsonb_set(
  COALESCE(raw_app_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email = 'your-admin@example.com';

-- Option 2: Via Supabase Dashboard
-- Navigate to Authentication > Users > Select User > Edit User Metadata
-- Add: { "role": "admin" }
```

#### Verify Admin Access
```sql
-- Check user metadata
SELECT email, raw_app_meta_data
FROM auth.users
WHERE email = 'your-admin@example.com';
```

---

### 5. Build & Deploy

#### Local Build Test
```bash
# Build all packages
pnpm install
pnpm run build

# Build web app specifically
npm run build --workspace=apps/web
```

#### Verify Build Success
- [ ] No TypeScript errors
- [ ] No linting errors
- [ ] All routes compiled
- [ ] Operator routes visible in build output:
  - [ ] `/api/operator/ask`
  - [ ] `/api/operator/anomalies`
  - [ ] `/api/operator/changes`
  - [ ] `/api/operator/changes/[id]/approve`
  - [ ] `/api/operator/changes/[id]/reject`

#### Deploy to Production
- [ ] Push to main branch
- [ ] Trigger deployment (Vercel/Netlify/etc.)
- [ ] Wait for deployment success
- [ ] Verify deployment URL

---

### 6. Post-Deployment Verification

#### Health Checks

**1. Database Connectivity**
```bash
curl -X GET https://your-domain.com/api/operator/anomalies \
  -H "Authorization: Bearer YOUR_TOKEN"
```
Expected: 200 OK or 401 Unauthorized (if not logged in)

**2. Admin UI Access**
- [ ] Navigate to `https://your-domain.com/admin/operator`
- [ ] Verify redirect to login (if not authenticated)
- [ ] Login as admin user
- [ ] Verify page loads successfully

**3. Ask Operator**
- [ ] Enter test question: "Is the system healthy?"
- [ ] Click "Ask Operator"
- [ ] Verify response received
- [ ] Check for errors in browser console

**4. Anomalies Table**
- [ ] Verify table loads (or shows "No anomalies found")
- [ ] Click "Refresh" button
- [ ] Test marketplace filter

**5. Change Requests Table**
- [ ] Verify table loads (or shows "No change requests found")
- [ ] Click "Refresh" button

---

### 7. Integration Testing

#### Scraper Integration
- [ ] Verify scraper logs anomalies to `scrape_anomalies`
- [ ] Verify scraper logs runs to `scrape_runs`
- [ ] Verify resolver logs decisions to `resolver_decisions`

#### Test Anomaly Creation
```sql
-- Insert test anomaly
INSERT INTO scrape_anomalies (
  type, severity, marketplace, source, query
) VALUES (
  'ZERO_RESULTS', 'high', 'craigslist', 'diy', 'test query'
);

-- Verify in UI
-- Navigate to Anomalies table, should see new row
```

#### Test Change Request Creation
```sql
-- Insert test change request
INSERT INTO operator_change_requests (
  marketplace, change_type, risk_level, rationale,
  change_payload, rollback_payload
) VALUES (
  'craigslist',
  'toggle_marketplace',
  'high',
  'Test change request',
  '{"enabled": false}'::jsonb,
  '{"enabled": true}'::jsonb
);

-- Verify in UI
-- Navigate to Change Requests table, should see new row
```

---

### 8. Security Verification

#### Authentication Tests
- [ ] Non-admin cannot access `/admin/operator` (404)
- [ ] Non-admin cannot call `/api/operator/*` (403)
- [ ] Admin can access all routes
- [ ] Logout redirects to login

#### Authorization Tests
- [ ] Service role can write to operator tables
- [ ] Regular users cannot query operator tables
- [ ] Admin can read operator tables (via API)

#### Penetration Testing
- [ ] Attempt direct database access (should fail)
- [ ] Attempt API access without auth (should fail)
- [ ] Attempt API access with non-admin role (should fail)
- [ ] Attempt SQL injection (should be sanitized)

---

### 9. Performance Testing

#### Load Testing
- [ ] 10 concurrent "Ask Operator" requests
- [ ] 50 concurrent anomaly table loads
- [ ] 100 concurrent change request fetches

#### Response Time Targets
- [ ] Ask Operator: < 5s (AI call)
- [ ] Anomalies table: < 1s
- [ ] Change requests table: < 1s
- [ ] Approve/reject action: < 500ms

---

### 10. Monitoring Setup

#### Application Logs
- [ ] Verify Operator logs appear in console
- [ ] Set up log aggregation (Datadog, Sentry, etc.)
- [ ] Configure alerts for errors

#### Database Monitoring
- [ ] Monitor `scrape_anomalies` growth
- [ ] Monitor `operator_change_requests` status
- [ ] Set up alerts for critical anomalies

#### API Monitoring
- [ ] Track `/api/operator/ask` response times
- [ ] Track error rates
- [ ] Set up uptime monitoring

---

### 11. Documentation

#### Internal Documentation
- [ ] Share `OPERATOR_UI_GUIDE.md` with team
- [ ] Share `OPERATOR_ADMIN_UI_SUMMARY.md` with stakeholders
- [ ] Document admin user creation process
- [ ] Document emergency procedures

#### Runbooks
- [ ] Create incident response runbook
- [ ] Create rollback procedure
- [ ] Create disaster recovery plan

---

### 12. Rollback Plan

#### If Deployment Fails

**Option 1: Revert Deployment**
```bash
# Revert to previous deployment
git revert HEAD
git push origin main
```

**Option 2: Disable Operator Routes**
```typescript
// apps/web/app/admin/operator/page.tsx
export default async function OperatorAdminPage() {
  return <div>Temporarily disabled</div>;
}
```

**Option 3: Database Rollback**
```sql
-- Drop operator tables (if needed)
DROP TABLE IF EXISTS operator_kb_chunks CASCADE;
DROP TABLE IF EXISTS operator_kb_documents CASCADE;
DROP TABLE IF EXISTS operator_change_requests CASCADE;
DROP TABLE IF EXISTS marketplace_control CASCADE;
DROP TABLE IF EXISTS resolver_decisions CASCADE;
DROP TABLE IF EXISTS scrape_anomalies CASCADE;
DROP TABLE IF EXISTS scrape_runs CASCADE;
```

---

### 13. Training & Onboarding

#### Admin Training
- [ ] Schedule demo session
- [ ] Walk through UI features
- [ ] Explain approval workflow
- [ ] Review security model

#### Developer Training
- [ ] Explain architecture
- [ ] Review code structure
- [ ] Document API endpoints
- [ ] Share testing procedures

---

## Post-Deployment Tasks

### Week 1
- [ ] Monitor error rates daily
- [ ] Review anomaly patterns
- [ ] Collect user feedback
- [ ] Optimize AI prompts if needed

### Week 2
- [ ] Analyze performance metrics
- [ ] Review change request patterns
- [ ] Adjust RAG thresholds if needed
- [ ] Document lessons learned

### Month 1
- [ ] Evaluate AI provider costs
- [ ] Consider multi-provider fallback
- [ ] Plan Phase 2 enhancements
- [ ] Conduct security audit

---

## Success Criteria

### Deployment Success
- [ ] Build passes cleanly
- [ ] All routes accessible
- [ ] Admin can use UI
- [ ] No critical errors in logs

### Operational Success
- [ ] Anomalies logged correctly
- [ ] Operator provides useful insights
- [ ] Change requests created appropriately
- [ ] No security incidents

### Business Success
- [ ] Reduces time to diagnose issues
- [ ] Improves scraper reliability
- [ ] Enables data-driven decisions
- [ ] Reduces manual monitoring effort

---

## Emergency Contacts

- **System Administrator:** [Name/Email]
- **Database Administrator:** [Name/Email]
- **On-Call Engineer:** [Name/Phone]
- **Supabase Support:** support@supabase.io
- **OpenAI Support:** support@openai.com

---

## Sign-Off

### Pre-Deployment
- [ ] Technical Lead: ________________ Date: ______
- [ ] Security Review: ________________ Date: ______
- [ ] QA Approval: ________________ Date: ______

### Post-Deployment
- [ ] Deployment Verified: ________________ Date: ______
- [ ] Monitoring Active: ________________ Date: ______
- [ ] Team Trained: ________________ Date: ______

---

## Notes

_Add any deployment-specific notes here_

---

**Deployment Status:** ⬜ Not Started | ⬜ In Progress | ⬜ Complete  
**Last Updated:** December 23, 2025  
**Next Review:** [Date]

