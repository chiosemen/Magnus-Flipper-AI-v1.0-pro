# Kill Switch Reference Card

**Purpose:** Runtime control over features WITHOUT code deployment
**Access:** https://app.example.com/dashboard → Admin Controls Panel
**Last Updated:** 2025-12-22

---

## Quick Reference Table

| Switch Name | Database Table | Column | Current Value | Effect | Propagation Time |
|-------------|----------------|--------|---------------|--------|------------------|
| **Global Scraping Kill** | `admin_controls` | `disable_all_scraping` | `false` | Stops ALL scraping globally | 1-5 min |
| **Facebook Scraping** | `admin_controls` | `disable_marketplace_facebook` | `false` | Stops Facebook scraping only | 1-5 min |
| **Cars.com Scraping** | `admin_controls` | `disable_marketplace_cars` | `false` | Stops Cars.com scraping only | 1-5 min |
| **Rate Multiplier** | `admin_controls` | `global_rate_multiplier` | `1.0` | Adjusts scraping speed (0.1 = 10%, 2.0 = 200%) | 1-5 min |
| **Admin Notes** | `admin_controls` | `notes` | `""` | Audit trail for changes | Immediate (display only) |

---

## How to Toggle (3 Methods)

### Method 1: Admin UI (Recommended)

1. Go to https://app.example.com/dashboard
2. Scroll to "Admin Kill-Switches" panel
3. Toggle desired switch
4. Confirm action in dialog
5. Wait 1-5 min for workers to read flag

**Pros:** Visual, requires confirmation for dangerous actions
**Cons:** Requires admin login

---

### Method 2: Direct SQL (Fastest)

```sql
-- Enable global kill switch
UPDATE admin_controls SET disable_all_scraping = true;

-- Disable Facebook scraping
UPDATE admin_controls SET disable_marketplace_facebook = true;

-- Slow down scraping to 50% speed
UPDATE admin_controls SET global_rate_multiplier = 0.5;

-- Check current state
SELECT * FROM admin_controls;
```

**Pros:** Instant, no UI needed
**Cons:** No confirmation dialog, easy to typo

---

### Method 3: API Call (Programmatic)

```bash
# Enable global kill switch
curl -X PATCH https://app.example.com/api/admin/controls \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin-token>" \
  -d '{"disable_all_scraping": true}'

# Disable Facebook scraping
curl -X PATCH https://app.example.com/api/admin/controls \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin-token>" \
  -d '{"disable_marketplace_facebook": true}'

# Set rate multiplier to 0.5
curl -X PATCH https://app.example.com/api/admin/controls \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin-token>" \
  -d '{"global_rate_multiplier": 0.5}'
```

**Pros:** Scriptable, can integrate with monitoring/alerting
**Cons:** Requires auth token, no UI feedback

---

## Behavioral Matrix

**Never-Disappear Contract:** All switches disable BEHAVIOR, not UI VISIBILITY.

| Switch State | Scraping Active | UI Sections Visible | Data Access | User Alerts | Admin Can Override |
|--------------|----------------|---------------------|-------------|-------------|-------------------|
| **All OFF** | ✅ Running | ✅ All visible | ✅ Read/Write | ✅ Dispatching | N/A |
| **Global Kill ON** | ❌ Stopped | ✅ All visible (disabled state) | ✅ Read existing data | ❌ Paused | No (global override) |
| **Facebook Kill ON** | ⚡ Facebook stopped, others running | ✅ All visible | ✅ Read existing Facebook data | ⚡ Facebook alerts paused | Yes (re-enable in UI) |
| **Rate 0.5x** | ⚡ Slowed (50% speed) | ✅ All visible | ✅ Read/Write (slower) | ✅ Dispatching (slower) | Yes (adjust multiplier) |
| **Rate 0.0x** | ❌ Effectively stopped | ✅ All visible | ✅ Read existing data | ❌ Paused | Yes (set to >0) |

---

## UI Behavior When Disabled

### Example: Facebook Scraping Disabled

**User View:**
```
┌─────────────────────────────────────────────┐
│ Facebook Marketplace                         │
│ ⚠️ Temporarily Paused                        │
│                                              │
│ Facebook scraping is currently disabled.    │
│ Existing deals are still visible below.     │
│ New deals will appear when scraping         │
│ resumes.                                     │
│                                              │
│ [View Existing Deals (1,234)] ───────────── │
└─────────────────────────────────────────────┘
```

**What Users SEE:**
- ✅ Section remains visible
- ✅ Disabled state banner
- ✅ Explanation message
- ✅ Existing data accessible

**What Users DON'T SEE:**
- ❌ Blank space
- ❌ "Section removed"
- ❌ Confusing error messages

---

## Worker Behavior When Disabled

### Worker Scheduler (Reads flags every 1-5 min)

**Pseudocode:**
```typescript
async function schedulerLoop() {
  while (true) {
    // Read flags from Supabase
    const controls = await getAdminControls();

    if (controls.disable_all_scraping) {
      logger.info('Global kill switch enabled, skipping all scraping');
      await sleep(60_000); // Sleep 1 min, check again
      continue;
    }

    for (const marketplace of ['facebook', 'cars', 'ebay']) {
      const isDisabled = controls[`disable_marketplace_${marketplace}`];

      if (isDisabled) {
        logger.info(`${marketplace} disabled, skipping`);
        continue;
      }

      const rateMultiplier = controls.global_rate_multiplier || 1.0;
      const delayMs = BASE_DELAY_MS / rateMultiplier;

      await scrapeMarketplace(marketplace);
      await sleep(delayMs);
    }
  }
}
```

**Key Points:**
- Workers poll flags every loop iteration (1-5 min)
- When disabled, workers skip that marketplace
- Workers do NOT crash, they just skip
- Eventual consistency (not instant)

---

## Common Use Cases

### Use Case 1: Emergency Stop

**Scenario:** Workers are causing outage (too many errors, rate limits)

**Action:**
```sql
UPDATE admin_controls SET disable_all_scraping = true;
```

**Effect:**
- All workers stop scraping within 1-5 min
- UI remains functional (shows stale data)
- Users see "Scraping paused" messages
- No data loss (existing data intact)

**Recovery:**
```sql
UPDATE admin_controls SET disable_all_scraping = false;
```

---

### Use Case 2: Marketplace API Issues

**Scenario:** Facebook API is returning 429 rate limits

**Action:**
```sql
UPDATE admin_controls SET disable_marketplace_facebook = true;
```

**Effect:**
- Facebook scraping stops within 1-5 min
- Other marketplaces continue scraping
- UI shows Facebook section with "Temporarily paused" message
- Existing Facebook deals still visible

**Recovery:**
```sql
UPDATE admin_controls SET disable_marketplace_facebook = false;
```

---

### Use Case 3: Throttle Scraping (Cost Control)

**Scenario:** Apify costs are too high, need to slow down

**Action:**
```sql
UPDATE admin_controls SET global_rate_multiplier = 0.5; -- 50% speed
```

**Effect:**
- All workers scrape at 50% normal speed
- Delay between scrapes doubles
- No visible change to UI (behind-the-scenes)
- Costs reduced proportionally

**Recovery:**
```sql
UPDATE admin_controls SET global_rate_multiplier = 1.0; -- back to normal
```

---

### Use Case 4: Maintenance Window

**Scenario:** Database maintenance, need to stop writes

**Action:**
```sql
UPDATE admin_controls SET disable_all_scraping = true;
```

**Effect:**
- Workers stop writing to database within 1-5 min
- UI remains read-only
- No data corruption during maintenance

**Recovery (after maintenance):**
```sql
UPDATE admin_controls SET disable_all_scraping = false;
```

---

## Monitoring Kill Switch State

### Check Current State

```sql
SELECT
  disable_all_scraping,
  disable_marketplace_facebook,
  disable_marketplace_cars,
  global_rate_multiplier,
  updated_at,
  updated_by,
  notes
FROM admin_controls;
```

**Expected Output:**
```
disable_all_scraping | disable_marketplace_facebook | global_rate_multiplier | updated_at           | updated_by
---------------------|------------------------------|------------------------|----------------------|------------
false                | false                         | 1.0                    | 2025-12-22 10:30:00  | admin@example.com
```

---

### Audit Log (Who Changed What)

```sql
SELECT
  updated_at,
  updated_by,
  notes,
  disable_all_scraping,
  disable_marketplace_facebook,
  global_rate_multiplier
FROM admin_controls_history
ORDER BY updated_at DESC
LIMIT 10;
```

**Note:** `admin_controls_history` table must be created with triggers for audit logging.

---

## Alerts & Monitoring

### Set Up Alerts

**Alert 1: Global Kill Switch Enabled**
```
Trigger: admin_controls.disable_all_scraping = true
Severity: HIGH
Message: "Global scraping kill switch is ACTIVE. All scraping is paused."
Action: Notify #incidents Slack channel
```

**Alert 2: Kill Switch Active >1 Hour**
```
Trigger: admin_controls.disable_all_scraping = true AND updated_at < NOW() - INTERVAL '1 hour'
Severity: MEDIUM
Message: "Global kill switch has been active for >1 hour. Is this intentional?"
Action: Notify on-call engineer
```

**Alert 3: Rate Multiplier <0.5**
```
Trigger: admin_controls.global_rate_multiplier < 0.5
Severity: LOW
Message: "Scraping is throttled to <50% speed. Check if intentional."
Action: Log to monitoring dashboard
```

---

## Troubleshooting

### Problem: Toggle in UI, But Workers Still Running

**Cause:** Workers haven't polled flag yet (eventual consistency)

**Solution:** Wait 1-5 minutes. Check worker logs to see when flag is read.

**Verify:**
```sql
-- Check when workers last read flags (if logging this)
SELECT worker_id, last_flag_poll_at FROM worker_heartbeat;
```

---

### Problem: Toggle via SQL, But UI Shows Old Value

**Cause:** UI cache (client-side state)

**Solution:** Refresh page or wait for next UI poll (every 30s)

---

### Problem: Can't Toggle Switch (UI Says "Unauthorized")

**Cause:** User doesn't have admin role

**Solution:** Check user role:
```sql
SELECT id, email, role FROM users WHERE email = 'user@example.com';
```

If role is not `admin`, contact super admin to grant role.

---

### Problem: Workers Ignore Kill Switch

**Cause:** Workers not reading `admin_controls` table

**Solution:** Check worker implementation. Ensure scheduler loop reads flags:
```typescript
const controls = await supabase.from('admin_controls').select('*').single();
if (controls.data.disable_all_scraping) {
  return; // Skip scraping
}
```

---

## Security & Permissions

### Who Can Toggle Kill Switches?

**Requirement:** User must have `role = 'admin'` in `app_metadata`

**Enforcement:**
1. **Client-side:** UI hides admin panel for non-admins (UX only, not security)
2. **API route:** `/api/admin/controls` checks user role server-side
3. **Supabase RLS:** Row-level security requires admin role for `UPDATE`

**Verify RLS Policy:**
```sql
-- Check existing policies
\d+ admin_controls

-- Expected policy:
CREATE POLICY admin_controls_update_policy ON admin_controls
  FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'admin');
```

---

### Audit Trail

**All changes are logged:**
- `updated_at` - Timestamp of change
- `updated_by` - Email of admin who made change
- `notes` - Optional reason for change

**Best Practice:** Always fill in `notes` field when toggling critical switches:
```sql
UPDATE admin_controls
SET disable_all_scraping = true,
    notes = 'Emergency: Facebook API outage causing 429 errors'
WHERE id = 1;
```

---

## Appendix: Database Schema

```sql
CREATE TABLE admin_controls (
  id SERIAL PRIMARY KEY,
  disable_all_scraping BOOLEAN DEFAULT false,
  disable_marketplace_facebook BOOLEAN DEFAULT false,
  disable_marketplace_cars BOOLEAN DEFAULT false,
  global_rate_multiplier DECIMAL(3,2) DEFAULT 1.0,
  notes TEXT DEFAULT '',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by TEXT
);

-- Ensure only one row exists
INSERT INTO admin_controls (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER admin_controls_updated_at
  BEFORE UPDATE ON admin_controls
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

---

**Remember:** Kill switches are for emergencies. Use them to stop bleeding, then fix root cause.
