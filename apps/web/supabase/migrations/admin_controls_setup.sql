-- ============================================================================
-- Admin Controls Table - SAFE MODE Kill-Switches
-- ============================================================================
-- This table stores configuration flags for controlling marketplace scraping.
--
-- CRITICAL ARCHITECTURE:
-- =====================
-- - This is a CONFIGURATION table, not a command queue
-- - Workers read flags on their NEXT cycle (eventual consistency)
-- - NO direct worker manipulation, NO race conditions
-- - Single source of truth for system-wide scraping behavior
--
-- WHY THIS IS SAFER THAN DIRECT JOB CANCELLATION:
-- ================================================
-- - Workers poll this table periodically (~1-5 min)
-- - No distributed coordination required (no Redis PubSub, no BullMQ events)
-- - Idempotent operations (setting flag multiple times is safe)
-- - Audit trail built-in (updated_at, updated_by)
-- - No tight coupling between admin UI and worker processes
--
-- WHY THIS PRESERVES POOLED-ONLY DOCTRINE:
-- ========================================
-- - Flags control worker behavior, NOT data queries
-- - Dashboard remains read-only for data visualization
-- - No per-user scraping triggers
-- - Workers self-throttle based on global configuration
--
-- SECURITY MODEL:
-- ===============
-- - Only admins can read/write (enforced by RLS)
-- - app_metadata.role === 'admin' required
-- - Server-side API route enforces admin check BEFORE Supabase access
-- - Client-side guards are UX only (not security)
-- ============================================================================

-- Create admin_controls table (single row with id = 1)
CREATE TABLE IF NOT EXISTS admin_controls (
  -- Primary key (always 1 for singleton pattern)
  id BIGINT PRIMARY KEY DEFAULT 1,

  -- Global kill-switch (emergency stop for all scraping)
  disable_all_scraping BOOLEAN NOT NULL DEFAULT false,

  -- Marketplace-specific kill-switches
  disable_marketplace_facebook BOOLEAN NOT NULL DEFAULT false,
  disable_marketplace_cars BOOLEAN NOT NULL DEFAULT false,
  -- Add more marketplace flags as needed:
  -- disable_marketplace_craigslist BOOLEAN NOT NULL DEFAULT false,
  -- disable_marketplace_offerup BOOLEAN NOT NULL DEFAULT false,

  -- Global rate multiplier (adjust scraping frequency)
  -- 1.0 = normal speed, 0.5 = half speed, 2.0 = double speed
  global_rate_multiplier REAL NOT NULL DEFAULT 1.0 CHECK (global_rate_multiplier >= 0.1 AND global_rate_multiplier <= 3.0),

  -- Admin notes (reason for changes, incidents, etc.)
  notes TEXT,

  -- Audit fields
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by TEXT,

  -- Ensure only one row exists
  CONSTRAINT admin_controls_singleton CHECK (id = 1)
);

-- Create index on id for fast lookups (even though it's a singleton)
CREATE INDEX IF NOT EXISTS idx_admin_controls_id ON admin_controls(id);

-- Insert default row if it doesn't exist
INSERT INTO admin_controls (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Row-Level Security (RLS) Policies
-- ============================================================================
-- CRITICAL: These policies enforce that ONLY admins can access this table.
-- Workers must use service role key (bypasses RLS) or admin credentials.
-- ============================================================================

-- Enable RLS on admin_controls table
ALTER TABLE admin_controls ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can read admin_controls
-- Uses auth.jwt() to check app_metadata.role from Supabase Auth
CREATE POLICY "Admin can read admin_controls"
ON admin_controls
FOR SELECT
USING (
  (auth.jwt() ->> 'role') = 'admin'
);

-- Policy: Admins can update admin_controls
CREATE POLICY "Admin can update admin_controls"
ON admin_controls
FOR UPDATE
USING (
  (auth.jwt() ->> 'role') = 'admin'
);

-- ============================================================================
-- Auto-update trigger for updated_at timestamp
-- ============================================================================
-- Automatically update updated_at whenever a row is modified
-- ============================================================================

-- Create trigger function
CREATE OR REPLACE FUNCTION update_admin_controls_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to admin_controls table
DROP TRIGGER IF EXISTS admin_controls_updated_at ON admin_controls;
CREATE TRIGGER admin_controls_updated_at
BEFORE UPDATE ON admin_controls
FOR EACH ROW
EXECUTE FUNCTION update_admin_controls_timestamp();

-- ============================================================================
-- WORKER INTEGRATION EXAMPLE (for reference, not executed here)
-- ============================================================================
-- Workers should poll this table at the start of each scraping cycle:
--
-- ```typescript
-- // At start of worker cycle (e.g., in cron or queue handler)
-- const supabase = createSupabaseServiceRoleClient(); // Service role bypasses RLS
--
-- const { data: controls, error } = await supabase
--   .from("admin_controls")
--   .select("*")
--   .eq("id", 1)
--   .single();
--
-- if (error) {
--   console.error("Failed to fetch admin controls, defaulting to safe mode");
--   return; // Fail-safe: stop scraping if controls can't be fetched
-- }
--
-- // Check global kill-switch
-- if (controls.disable_all_scraping) {
--   console.log("🚨 Global scraping disabled by admin");
--   return; // Exit worker cycle
-- }
--
-- // Check marketplace-specific kill-switch
-- const marketplaceFlag = `disable_marketplace_${marketplace}`;
-- if (controls[marketplaceFlag]) {
--   console.log(`🚨 Marketplace ${marketplace} disabled by admin`);
--   return; // Skip this marketplace
-- }
--
-- // Apply rate multiplier to delay
-- const adjustedDelay = BASE_DELAY_MS * controls.global_rate_multiplier;
-- console.log(`⚡ Rate multiplier: ${controls.global_rate_multiplier}x (delay: ${adjustedDelay}ms)`);
--
-- // Proceed with scraping...
-- await scrapeMarketplace(marketplace, { delay: adjustedDelay });
-- ```
-- ============================================================================

-- ============================================================================
-- Verification Queries (for testing)
-- ============================================================================
-- Check if table exists and has default row:
-- SELECT * FROM admin_controls WHERE id = 1;
--
-- Test admin access (must be run as admin user):
-- UPDATE admin_controls SET disable_all_scraping = true WHERE id = 1;
-- UPDATE admin_controls SET disable_all_scraping = false WHERE id = 1;
--
-- Verify RLS policies:
-- SELECT * FROM pg_policies WHERE tablename = 'admin_controls';
-- ============================================================================
