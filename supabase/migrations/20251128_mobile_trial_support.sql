-- Migration: Mobile Trial Support
-- Created: 2025-11-28
-- Description: Adds trial subscription support with Stripe integration for mobile onboarding

-- ============================================================================
-- 1. UPDATE USERS TABLE FOR TRIAL SUPPORT
-- ============================================================================

-- Add Stripe-related columns
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS payment_method_id TEXT;

-- Add subscription status tracking
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS subscription_status TEXT;

-- Add trial expiration tracking
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMPTZ;

-- Create index for faster Stripe customer lookups
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id
ON public.users(stripe_customer_id);

-- Create index for subscription status queries
CREATE INDEX IF NOT EXISTS idx_users_subscription_status
ON public.users(subscription_status);

-- Update subscription_plan constraint to include TRIAL
ALTER TABLE public.users
DROP CONSTRAINT IF EXISTS subscription_plan_check;

ALTER TABLE public.users
ADD CONSTRAINT subscription_plan_check
CHECK (subscription_plan IN ('STARTER', 'BASIC', 'PREMIUM', 'ULTRA', 'TRIAL'));

-- Add check constraint for subscription status
ALTER TABLE public.users
ADD CONSTRAINT subscription_status_check
CHECK (subscription_status IS NULL OR subscription_status IN (
  'active', 'trialing', 'past_due', 'canceled', 'unpaid', 'expired'
));

-- Add comments
COMMENT ON COLUMN public.users.stripe_customer_id IS 'Stripe customer ID for payment processing';
COMMENT ON COLUMN public.users.payment_method_id IS 'Default Stripe payment method ID';
COMMENT ON COLUMN public.users.subscription_status IS 'Current subscription status: active, trialing, past_due, canceled, unpaid, expired';
COMMENT ON COLUMN public.users.trial_expires_at IS 'Timestamp when trial period ends';

-- ============================================================================
-- 2. CREATE TRIAL_SESSIONS TABLE
-- ============================================================================

-- Create trial_sessions table to track trial onboarding flow
CREATE TABLE IF NOT EXISTS public.trial_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  setup_intent_id TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::JSONB,

  -- Foreign key to users
  CONSTRAINT fk_trial_sessions_user
    FOREIGN KEY (user_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE
);

-- Add check constraint for status
ALTER TABLE public.trial_sessions
ADD CONSTRAINT trial_sessions_status_check
CHECK (status IN ('pending', 'confirmed', 'failed', 'expired'));

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_trial_sessions_user_id
ON public.trial_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_trial_sessions_setup_intent_id
ON public.trial_sessions(setup_intent_id);

CREATE INDEX IF NOT EXISTS idx_trial_sessions_status
ON public.trial_sessions(status);

CREATE INDEX IF NOT EXISTS idx_trial_sessions_created_at
ON public.trial_sessions(created_at DESC);

-- Add comments
COMMENT ON TABLE public.trial_sessions IS 'Tracks mobile trial onboarding sessions with Stripe SetupIntent';
COMMENT ON COLUMN public.trial_sessions.setup_intent_id IS 'Stripe SetupIntent ID for payment method collection';
COMMENT ON COLUMN public.trial_sessions.status IS 'Trial session status: pending, confirmed, failed, expired';

-- ============================================================================
-- 3. ENABLE ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on trial_sessions
ALTER TABLE public.trial_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own trial sessions
CREATE POLICY "Own trial sessions"
  ON public.trial_sessions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 4. CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function to check if user's trial has expired
CREATE OR REPLACE FUNCTION is_trial_expired(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  trial_expiry TIMESTAMPTZ;
  sub_status TEXT;
BEGIN
  SELECT trial_expires_at, subscription_status
  INTO trial_expiry, sub_status
  FROM public.users
  WHERE id = user_uuid;

  -- If no trial expiry set, not expired
  IF trial_expiry IS NULL THEN
    RETURN FALSE;
  END IF;

  -- If status is trialing and current time is past expiry, it's expired
  IF sub_status = 'trialing' AND NOW() > trial_expiry THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get trial days remaining
CREATE OR REPLACE FUNCTION trial_days_remaining(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  trial_expiry TIMESTAMPTZ;
  sub_status TEXT;
  days_left INTEGER;
BEGIN
  SELECT trial_expires_at, subscription_status
  INTO trial_expiry, sub_status
  FROM public.users
  WHERE id = user_uuid;

  -- If no trial or not trialing, return 0
  IF trial_expiry IS NULL OR sub_status != 'trialing' THEN
    RETURN 0;
  END IF;

  -- Calculate days remaining
  days_left := CEIL(EXTRACT(EPOCH FROM (trial_expiry - NOW())) / 86400)::INTEGER;

  -- Return 0 if negative (expired)
  IF days_left < 0 THEN
    RETURN 0;
  END IF;

  RETURN days_left;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments
COMMENT ON FUNCTION is_trial_expired(UUID) IS 'Returns true if user trial period has expired';
COMMENT ON FUNCTION trial_days_remaining(UUID) IS 'Returns number of days remaining in trial, 0 if expired or no trial';

-- ============================================================================
-- 5. CREATE VIEW FOR TRIAL ANALYTICS (OPTIONAL)
-- ============================================================================

-- View to track trial conversion metrics
CREATE OR REPLACE VIEW public.trial_analytics AS
SELECT
  DATE_TRUNC('day', ts.created_at) AS trial_date,
  COUNT(*) AS trials_started,
  COUNT(ts.confirmed_at) AS trials_confirmed,
  COUNT(CASE WHEN ts.status = 'confirmed' THEN 1 END) AS trials_successful,
  COUNT(CASE WHEN ts.status = 'failed' THEN 1 END) AS trials_failed,
  ROUND(
    (COUNT(ts.confirmed_at)::NUMERIC / NULLIF(COUNT(*)::NUMERIC, 0)) * 100,
    2
  ) AS confirmation_rate_pct
FROM public.trial_sessions ts
GROUP BY DATE_TRUNC('day', ts.created_at)
ORDER BY trial_date DESC;

COMMENT ON VIEW public.trial_analytics IS 'Daily trial conversion metrics and analytics';

-- Grant access to authenticated users (adjust as needed)
-- GRANT SELECT ON public.trial_analytics TO authenticated;
