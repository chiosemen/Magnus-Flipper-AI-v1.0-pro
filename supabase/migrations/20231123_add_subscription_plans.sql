-- Migration: Add subscription plan support to users table
-- Created: 2023-11-23
-- Description: Adds subscription_plan column and related constraints for multi-tier membership

-- Add subscription_plan column to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS subscription_plan TEXT NOT NULL DEFAULT 'STARTER';

-- Add check constraint to ensure only valid plans are used
ALTER TABLE public.users
ADD CONSTRAINT subscription_plan_check
CHECK (subscription_plan IN ('STARTER', 'BASIC', 'PREMIUM', 'ULTRA'));

-- Add index for faster plan-based queries
CREATE INDEX IF NOT EXISTS idx_users_subscription_plan
ON public.users(subscription_plan);

-- Add timestamp for plan changes tracking
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS subscription_updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create function to automatically update subscription_updated_at
CREATE OR REPLACE FUNCTION update_subscription_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.subscription_plan IS DISTINCT FROM NEW.subscription_plan THEN
    NEW.subscription_updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to track subscription plan changes
DROP TRIGGER IF EXISTS trigger_update_subscription_timestamp ON public.users;
CREATE TRIGGER trigger_update_subscription_timestamp
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION update_subscription_timestamp();

-- Update existing users to have STARTER plan if they don't have one
UPDATE public.users
SET subscription_plan = 'STARTER'
WHERE subscription_plan IS NULL;

COMMENT ON COLUMN public.users.subscription_plan IS 'User subscription tier: STARTER, BASIC, PREMIUM, or ULTRA';
COMMENT ON COLUMN public.users.subscription_updated_at IS 'Timestamp of last subscription plan change';
