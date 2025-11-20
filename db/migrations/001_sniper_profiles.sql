-- Migration: Add Sniper Profiles and related tables
-- Run this migration to add the sniper functionality to your database

-- ============================================
-- SNIPER PROFILES TABLE
-- ============================================

-- Create sniper_profiles table
CREATE TABLE IF NOT EXISTS sniper_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,

    -- Marketplace selection
    marketplace VARCHAR(50) NOT NULL,

    -- Search criteria
    query TEXT NOT NULL,
    min_price DECIMAL(10, 2),
    max_price DECIMAL(10, 2),
    location VARCHAR(255),
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    radius_km INTEGER DEFAULT 10,
    conditions JSONB DEFAULT '["any"]',

    -- Alert logic
    undervalue_threshold INTEGER DEFAULT 20,
    max_alerts_per_day INTEGER DEFAULT 10,
    score_threshold INTEGER DEFAULT 70,

    -- Scanning settings
    scan_interval_seconds INTEGER DEFAULT 60,
    is_active BOOLEAN DEFAULT true,

    -- Status tracking
    status VARCHAR(50) DEFAULT 'active',
    last_scan_at TIMESTAMP WITH TIME ZONE,
    last_error TEXT,
    total_scans INTEGER DEFAULT 0,
    total_alerts_sent INTEGER DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT valid_price_range CHECK (min_price IS NULL OR max_price IS NULL OR min_price <= max_price),
    CONSTRAINT valid_undervalue CHECK (undervalue_threshold >= 0 AND undervalue_threshold <= 100)
);

-- ============================================
-- TELEGRAM LINKING
-- ============================================

CREATE TABLE IF NOT EXISTS telegram_link_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(64) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- WHATSAPP VERIFICATION
-- ============================================

CREATE TABLE IF NOT EXISTS whatsapp_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    phone_number VARCHAR(20) NOT NULL,
    verification_code VARCHAR(6),
    verified BOOLEAN DEFAULT false,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- BROWSER PROFILES (Anti-ban)
-- ============================================

CREATE TABLE IF NOT EXISTS browser_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    marketplace VARCHAR(50) NOT NULL,
    profile_data JSONB NOT NULL,
    last_used_at TIMESTAMP WITH TIME ZONE,
    is_healthy BOOLEAN DEFAULT true,
    error_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(user_id, marketplace)
);

-- ============================================
-- LISTINGS TABLE (if not exists)
-- ============================================

CREATE TABLE IF NOT EXISTS listings (
    id VARCHAR(100) PRIMARY KEY,
    profile_id UUID REFERENCES sniper_profiles(id) ON DELETE SET NULL,
    marketplace VARCHAR(50) NOT NULL,

    title TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    location VARCHAR(255),
    category VARCHAR(100),
    condition VARCHAR(50),

    image_url TEXT,
    listing_url TEXT,
    seller_id VARCHAR(100),

    scores JSONB,

    first_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT listing_price_positive CHECK (price >= 0)
);

-- ============================================
-- ALERT LOGS TABLE (if not exists)
-- ============================================

CREATE TABLE IF NOT EXISTS alert_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES sniper_profiles(id) ON DELETE SET NULL,
    listing_id VARCHAR(100) REFERENCES listings(id) ON DELETE SET NULL,

    alert_type VARCHAR(50) NOT NULL,
    channels_sent JSONB DEFAULT '[]',
    success BOOLEAN DEFAULT false,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_sniper_profiles_user_id ON sniper_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_sniper_profiles_active ON sniper_profiles(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_sniper_profiles_status ON sniper_profiles(status);
CREATE INDEX IF NOT EXISTS idx_sniper_profiles_marketplace ON sniper_profiles(marketplace);
CREATE INDEX IF NOT EXISTS idx_listings_profile_id ON listings(profile_id);
CREATE INDEX IF NOT EXISTS idx_listings_marketplace ON listings(marketplace);
CREATE INDEX IF NOT EXISTS idx_listings_scraped_at ON listings(scraped_at);
CREATE INDEX IF NOT EXISTS idx_alert_logs_user_id ON alert_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_alert_logs_created_at ON alert_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_telegram_link_tokens_token ON telegram_link_tokens(token) WHERE used = false;
CREATE INDEX IF NOT EXISTS idx_browser_profiles_user_marketplace ON browser_profiles(user_id, marketplace);

-- ============================================
-- ADD COLUMNS TO USERS TABLE (if needed)
-- ============================================

-- Add telegram fields if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'telegram_chat_id') THEN
        ALTER TABLE users ADD COLUMN telegram_chat_id VARCHAR(50);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'telegram_enabled') THEN
        ALTER TABLE users ADD COLUMN telegram_enabled BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'whatsapp_number') THEN
        ALTER TABLE users ADD COLUMN whatsapp_number VARCHAR(20);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'whatsapp_enabled') THEN
        ALTER TABLE users ADD COLUMN whatsapp_enabled BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'push_token') THEN
        ALTER TABLE users ADD COLUMN push_token TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'push_enabled') THEN
        ALTER TABLE users ADD COLUMN push_enabled BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'sms_number') THEN
        ALTER TABLE users ADD COLUMN sms_number VARCHAR(20);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'sms_enabled') THEN
        ALTER TABLE users ADD COLUMN sms_enabled BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Create index on telegram_chat_id
CREATE INDEX IF NOT EXISTS idx_users_telegram_chat_id ON users(telegram_chat_id);

-- ============================================
-- TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for sniper_profiles
DROP TRIGGER IF EXISTS update_sniper_profiles_updated_at ON sniper_profiles;
CREATE TRIGGER update_sniper_profiles_updated_at
    BEFORE UPDATE ON sniper_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for browser_profiles
DROP TRIGGER IF EXISTS update_browser_profiles_updated_at ON browser_profiles;
CREATE TRIGGER update_browser_profiles_updated_at
    BEFORE UPDATE ON browser_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- DONE
-- ============================================
-- Migration completed successfully
