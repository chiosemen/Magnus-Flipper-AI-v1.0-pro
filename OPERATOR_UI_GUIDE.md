# Magnus Operator Agent - Admin UI User Guide

**Route:** `/admin/operator`  
**Access:** Admin-only (server-side enforced)  
**Purpose:** Internal intelligence and orchestration interface

---

## Page Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Operator Agent                                              │
│ Internal intelligence and orchestration system for          │
│ marketplace scraping                                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Ask Operator Agent                                          │
├─────────────────────────────────────────────────────────────┤
│ Question:                                                   │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Why did craigslist return zero results?                │ │
│ │                                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Marketplace (optional):  Time Window (hours):              │
│ ┌──────────────────────┐ ┌────────────────┐               │
│ │ craigslist           │ │ 24 hours    ▼  │               │
│ └──────────────────────┘ └────────────────┘               │
│                                                             │
│ [ Ask Operator ]                                           │
│                                                             │
│ ─────────────────────────────────────────────────────────  │
│                                                             │
│ [CRITICAL] Confidence: 85% ⚠️ Low confidence warning       │
│                                                             │
│ Diagnosis:                                                  │
│ Craigslist experienced selector drift. 15 zero-result      │
│ anomalies detected in last 24h. Apify rescued 80% of runs. │
│                                                             │
│ Health Snapshot:                                            │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Marketplace: craigslist                                 │ │
│ │ Score: 45/100                                           │ │
│ │ Trend: degrading                                        │ │
│ │ Dominant Failure: ZERO_RESULTS                          │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Recommendations:                                            │
│ • Investigate craigslist selector changes                  │
│ • Consider temporary marketplace disable                   │
│ • Review Apify actor configuration                         │
│                                                             │
│ Evidence:                                                   │
│ ┌────────────┬────────────┬────────────┬────────────┐      │
│ │ Anomalies  │ Runs       │ Decisions  │ KB Citations│      │
│ │     15     │     42     │     38     │      3      │      │
│ └────────────┴────────────┴────────────┴────────────┘      │
│                                                             │
│ ▶ Reasoning Trace (click to expand)                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Recent Anomalies                            [ Refresh ]     │
├─────────────────────────────────────────────────────────────┤
│ Filter: ┌──────────────────────────┐ [ Filter ]            │
│         │ craigslist               │                        │
│         └──────────────────────────┘                        │
│                                                             │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ Timestamp        │ Marketplace │ Source │ Type │ Severity││
│ ├───────────────────────────────────────────────────────┤  │
│ │ 12/23 14:32:15  │ craigslist  │ diy    │ ZERO │ high   ││
│ │ 12/23 14:28:42  │ facebook    │ apify  │ NOISE│ medium ││
│ │ 12/23 14:15:03  │ craigslist  │ diy    │ ZERO │ high   ││
│ └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Change Requests                             [ Refresh ]     │
├─────────────────────────────────────────────────────────────┤
│ ┌───────────────────────────────────────────────────────┐  │
│ │ Created    │ Marketplace │ Type    │ Risk │ Status │   ││
│ ├───────────────────────────────────────────────────────┤  │
│ │ 12/23 14:30│ craigslist  │ disable │ high │proposed│   ││
│ │            │             │         │      │[Approve]│   ││
│ │            │             │         │      │[Reject ]│   ││
│ └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Details

### 1. Ask Operator Panel

**Purpose:** Query the Operator Agent about system state

**Inputs:**
- **Question** (required): Natural language question
  - Example: "Why did craigslist return zero results?"
  - Example: "Is Facebook healthy today?"
  - Example: "Compare Apify vs DIY quality"

- **Marketplace** (optional): Filter to specific marketplace
  - Values: craigslist, facebook, offerup, vinted, etc.

- **Time Window** (optional): Historical data range
  - Options: 1 hour, 6 hours, 24 hours, 3 days
  - Default: 24 hours

**Response Display:**

1. **Status Badges**
   - Severity: low (gray), medium (yellow), high (orange), critical (red)
   - Confidence: Percentage (0-100%)
   - Warning: Shows if confidence < 60%

2. **Diagnosis**
   - Plain text explanation
   - Evidence-based reasoning
   - No hallucination (cites sources)

3. **Health Snapshot** (if marketplace specified)
   - Score: 0-100
   - Trend: improving, stable, degrading
   - Dominant Failure Mode: Most common anomaly type

4. **Recommendations**
   - Bulleted list of suggested actions
   - Proposal-only (no automatic execution)

5. **Evidence Summary**
   - Count of anomalies used
   - Count of runs analyzed
   - Count of resolver decisions
   - Count of KB citations

6. **Reasoning Trace** (collapsible)
   - Signals used
   - Hypotheses considered
   - False positive risk

**Error Handling:**
- Network errors: Red alert box with retry button
- API errors: Inline error message
- Low confidence: Yellow warning badge

---

### 2. Recent Anomalies Table

**Purpose:** View recent scraping anomalies

**Features:**
- Auto-loads on page mount
- Manual refresh button
- Marketplace filter (optional)

**Columns:**
- **Timestamp**: When anomaly occurred
- **Marketplace**: Badge with marketplace name
- **Source**: apify (blue) or diy (gray)
- **Type**: Anomaly type (ZERO_RESULTS, PARSING_NOISE, etc.)
- **Severity**: Color-coded badge
- **Query**: Search query (if present)

**Empty State:**
```
No anomalies found
```

**Error State:**
```
Error: Failed to fetch anomalies
```

**Data Source:** `GET /api/operator/anomalies`

---

### 3. Change Requests Table

**Purpose:** Review and approve/reject Operator proposals

**Features:**
- Auto-loads on page mount
- Manual refresh button
- Approve/reject actions for `proposed` status

**Columns:**
- **Created**: Timestamp
- **Marketplace**: Badge with marketplace name (if applicable)
- **Type**: Change type (toggle_marketplace, toggle_source, etc.)
- **Risk**: low (gray), medium (yellow), high (red)
- **Status**: proposed (yellow), approved (green), rejected (gray)
- **Rationale**: Summary text (truncated)

**Actions (for proposed status):**
- **Approve Button**: Opens confirmation dialog
- **Reject Button**: Opens confirmation dialog

**Confirmation Dialog:**
```
┌─────────────────────────────────────────────────────────────┐
│ Approve Change Request                                  [X] │
├─────────────────────────────────────────────────────────────┤
│ Marketplace: craigslist                                     │
│ Type: toggle_marketplace                                    │
│                                                             │
│ Hypothesis:                                                 │
│ Craigslist selector drift causing 80% failure rate.        │
│                                                             │
│ Expected Effect:                                            │
│ Reduce error rate, prevent wasted scrape budget.           │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Rollback Plan:                                          │ │
│ │ Re-enable marketplace via admin panel or direct DB      │ │
│ │ update to marketplace_control.enabled = true            │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ⚠️ This will mark the change request as approved.          │
│    The change will NOT be applied automatically.           │
│                                                             │
│                              [ Cancel ]  [ Approve ]        │
└─────────────────────────────────────────────────────────────┘
```

**Important:** Approval does NOT execute the change. It only updates the status to `approved`. Manual application is required.

**Empty State:**
```
No change requests found
```

**Error State:**
```
Error: Failed to fetch change requests
```

**Data Source:** `GET /api/operator/changes`

---

## Security Model

### Authentication Flow

1. User navigates to `/admin/operator`
2. Server checks:
   - User session exists?
   - User role === 'admin'?
3. If no: Redirect to `/login` or show 404
4. If yes: Render page

### Authorization Layers

1. **Page Level** (Server Component)
   - Checks `app_metadata.role === 'admin'`
   - Fail-closed: 404 for non-admins

2. **API Level** (All endpoints)
   - Verifies admin role on every request
   - Returns 401 (Unauthorized) or 403 (Forbidden)

3. **Database Level** (RLS)
   - Service role bypasses RLS
   - Regular users cannot query operator tables

### No Client-Side Bypass
- All guards run server-side
- No credentials in client code
- No direct database access from browser

---

## Usage Examples

### Example 1: Investigating Degradation

**Question:**
```
Why did craigslist return zero results in the last 6 hours?
```

**Marketplace:** `craigslist`  
**Time Window:** `6 hours`

**Expected Response:**
- Severity: high or critical
- Confidence: 70-90%
- Diagnosis: Cites specific anomalies, run failures, resolver decisions
- Recommendations: Investigate selectors, check Apify actor, consider disable

---

### Example 2: Health Check

**Question:**
```
Is Facebook healthy today?
```

**Marketplace:** `facebook`  
**Time Window:** `24 hours`

**Expected Response:**
- Severity: low or medium
- Confidence: 80-95%
- Health Snapshot: Score 85/100, trend stable
- Recommendations: Continue monitoring

---

### Example 3: Source Comparison

**Question:**
```
Compare Apify vs DIY quality for offerup
```

**Marketplace:** `offerup`  
**Time Window:** `24 hours`

**Expected Response:**
- Severity: medium
- Confidence: 75-85%
- Diagnosis: Apify rescued X% of runs, DIY had Y failures
- Recommendations: Prefer Apify, consider DIY fixes

---

### Example 4: Approving a Change Request

1. Navigate to Change Requests table
2. Find `proposed` request
3. Click **Approve** button
4. Review confirmation dialog:
   - Hypothesis
   - Expected effect
   - Rollback plan
5. Click **Approve** in dialog
6. Status updates to `approved`
7. **Manually apply change** (not automatic)

---

## Troubleshooting

### "Unauthorized" Error
- **Cause:** Not logged in
- **Fix:** Navigate to `/login`

### "Forbidden" Error
- **Cause:** Logged in but not admin
- **Fix:** Contact admin to grant role

### "No data" in tables
- **Cause:** No anomalies/changes in time window
- **Fix:** Adjust time window or wait for data

### "Failed to fetch" errors
- **Cause:** API error or network issue
- **Fix:** Check browser console, retry

### Low confidence warning
- **Cause:** Insufficient telemetry data
- **Fix:** Wait for more scrape runs, or treat diagnosis as hypothesis

---

## Best Practices

### Asking Questions
1. Be specific: "Why did X happen?" not "What's wrong?"
2. Include marketplace when relevant
3. Adjust time window based on issue recency
4. Review reasoning trace for transparency

### Reviewing Anomalies
1. Filter by marketplace to focus investigation
2. Look for patterns (repeated types, sources)
3. Cross-reference with change requests
4. Refresh periodically for latest data

### Approving Changes
1. Always read rollback plan
2. Verify hypothesis makes sense
3. Check risk level (high = extra caution)
4. Approve only if confident
5. Remember: approval ≠ execution

---

## Keyboard Shortcuts

None implemented (future enhancement).

---

## Browser Compatibility

- Chrome: ✅ Tested
- Firefox: ✅ Tested
- Safari: ✅ Tested
- Edge: ✅ Tested

---

## Mobile Support

- Responsive design: ✅ Yes
- Touch-friendly: ✅ Yes
- Recommended: Desktop for best experience

---

## Performance

- Initial load: < 2s
- API calls: < 1s (typical)
- Table refresh: < 500ms
- No polling (manual refresh only)

---

## Limitations

1. **No Real-Time Updates**
   - Tables require manual refresh
   - No WebSocket/polling

2. **No Pagination**
   - Fixed limits (50 anomalies, all changes)
   - Sufficient for MVP

3. **No Bulk Actions**
   - One change request at a time
   - Deliberate approval process

4. **No Visualizations**
   - Text and tables only
   - No charts or graphs

---

## Future Enhancements (Not in Scope)

- Real-time updates (WebSocket)
- Anomaly trend charts
- Health score visualization
- Change request history
- Audit log integration
- Email notifications
- Slack integration
- Keyboard shortcuts
- Bulk actions
- Export to CSV

---

## Support

For issues or questions:
1. Check browser console for errors
2. Review API logs (server-side)
3. Verify admin role assignment
4. Contact system administrator

---

## Related Documentation

- [Backend Implementation Summary](./PHASE_1_IMPLEMENTATION_SUMMARY.md)
- [Admin UI Implementation Summary](./OPERATOR_ADMIN_UI_SUMMARY.md)
- [Deployment Readiness Report](./DEPLOYMENT_READINESS_REPORT.md)
- [Environment Variables](./OPERATOR_AGENT_ENV.md)

---

**Last Updated:** December 23, 2025  
**Version:** 1.0.0  
**Status:** Production Ready

