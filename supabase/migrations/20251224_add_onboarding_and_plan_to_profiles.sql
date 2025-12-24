-- ============================================================================
-- Migration: Add onboarding and plan fields to profiles table
-- Date: 2025-12-24
-- Purpose: Support onboarding flow and plan-based access control
-- ============================================================================

-- ============================================================================
-- STEP 1: Add new columns to profiles table
-- ============================================================================

-- Add onboarding_completed column (default false for new users)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;

-- Add plan column (free, pro, agency, elite)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'free';

-- Add full_name column for user profile completeness
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS full_name text;

-- ============================================================================
-- STEP 2: Create indexes for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS profiles_onboarding_completed_idx
  ON public.profiles(onboarding_completed);

CREATE INDEX IF NOT EXISTS profiles_plan_idx
  ON public.profiles(plan);

-- ============================================================================
-- STEP 3: Create plan rank function for comparisons
-- ============================================================================

-- Helper function to get numeric rank of a plan
-- Used for plan-based access control (e.g., "requires pro or higher")
CREATE OR REPLACE FUNCTION public.plan_rank(plan_name text)
RETURNS integer
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN CASE plan_name
    WHEN 'free' THEN 1
    WHEN 'pro' THEN 2
    WHEN 'agency' THEN 3
    WHEN 'elite' THEN 4
    ELSE 0  -- Unknown plans get lowest rank
  END;
END;
$$;

-- ============================================================================
-- STEP 4: Create helper function to check if user is admin
-- ============================================================================

-- Helper function for RLS policies
CREATE OR REPLACE FUNCTION public.is_admin_user(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  admin_status boolean;
BEGIN
  SELECT is_admin INTO admin_status
  FROM public.profiles
  WHERE id = user_id;

  RETURN COALESCE(admin_status, false);
END;
$$;

-- ============================================================================
-- STEP 5: Update auto-create profile trigger to include new fields
-- ============================================================================

-- Update the handle_new_user function to include new fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Insert profile for new user with all default fields
    INSERT INTO public.profiles (
      id,
      email,
      role,
      is_admin,
      onboarding_completed,
      plan,
      full_name
    )
    VALUES (
        NEW.id,
        NEW.email,
        'user',
        false,
        false,  -- New users haven't completed onboarding
        'free', -- New users start on free plan
        NEW.raw_user_meta_data->>'full_name' -- Extract from signup metadata if provided
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      full_name = COALESCE(EXCLUDED.full_name, profiles.full_name);

    RETURN NEW;
END;
$$;

-- ============================================================================
-- STEP 6: Add constraints to ensure valid plan values
-- ============================================================================

-- Add check constraint for valid plan values
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_plan_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_plan_check
CHECK (plan IN ('free', 'pro', 'agency', 'elite'));

-- ============================================================================
-- STEP 7: Update existing rows with default values (if any)
-- ============================================================================

-- Ensure all existing profiles have onboarding_completed set
UPDATE public.profiles
SET onboarding_completed = COALESCE(onboarding_completed, true)
WHERE onboarding_completed IS NULL;

-- Ensure all existing profiles have a plan
UPDATE public.profiles
SET plan = COALESCE(plan, 'free')
WHERE plan IS NULL;

-- ============================================================================
-- STEP 8: Comments for documentation
-- ============================================================================

COMMENT ON COLUMN public.profiles.onboarding_completed IS
'Tracks whether user has completed initial onboarding flow. New users start with false.';

COMMENT ON COLUMN public.profiles.plan IS
'User subscription plan: free, pro, agency, or elite. Determines feature access.';

COMMENT ON COLUMN public.profiles.full_name IS
'User full name for display purposes';

COMMENT ON FUNCTION public.plan_rank(text) IS
'Returns numeric rank of a plan for comparison. Higher rank = more features.';

COMMENT ON FUNCTION public.is_admin_user(uuid) IS
'Helper function for RLS policies to check if a user has admin privileges';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- New users will now have:
-- - onboarding_completed: false (must complete onboarding)
-- - plan: 'free' (can upgrade later)
-- - full_name: extracted from signup metadata or null
--
-- Existing users:
-- - onboarding_completed: true (grandfathered in)
-- - plan: 'free' (can be manually upgraded)
-- ============================================================================
