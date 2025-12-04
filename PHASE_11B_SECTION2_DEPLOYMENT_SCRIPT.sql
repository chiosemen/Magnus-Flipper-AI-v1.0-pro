-- =====================================================
-- PHASE 11B - SECTION 2: SUPABASE DEPLOYMENT SCRIPT
-- =====================================================
-- This script consolidates all migrations for deployment
-- Execute in Supabase SQL Editor or via CLI
-- 
-- WARNING: This will modify your production database
-- Ensure you have a backup before proceeding
-- =====================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- NOTE: This is a consolidated script
-- For production, apply migrations individually in order:
-- 1. 0012_profit_engine_tables.sql
-- 2. 0013_shipping_engine_tables.sql
-- 3. 0014_scraper_sync_tables.sql
-- 4. 0015_agentic_engine_tables.sql
-- 5. 0016_launch_infra_pack.sql
-- 6. 20251130_alert_system.sql (if exists)
-- 7. 20251130_marketplace_listings.sql (if exists)
-- 8. 20251130_marketplace_analytics.sql (if exists)
-- 9. 20251130_expand_marketplace_support.sql (if exists)
-- 10. 20251130_analytics_enhancements.sql (if exists)
-- =====================================================

-- This script is a reference only
-- Apply migrations from supabase/migrations/ directory in order

