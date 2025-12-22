-- ============================================================================
-- Migration: Auto-create profile on user signup
-- Date: 2025-12-22
-- Purpose: Automatically create a profile row when a user signs up via Supabase Auth
-- ============================================================================

-- ============================================================================
-- STEP 1: Create function to auto-create profile
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Insert profile for new user
    -- Uses ON CONFLICT to make it idempotent (safe if profile already exists)
    INSERT INTO public.profiles (id, email, role, is_admin)
    VALUES (
        NEW.id,
        NEW.email,
        'user',
        false
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$;

-- ============================================================================
-- STEP 2: Create trigger on auth.users
-- ============================================================================

-- Drop existing trigger if it exists (safe to re-run migration)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger that fires after user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- STEP 3: Grant necessary permissions
-- ============================================================================

-- Ensure the trigger function has permission to insert into profiles
-- SECURITY DEFINER runs with permissions of function owner (postgres)
GRANT USAGE ON SCHEMA public TO postgres;
GRANT INSERT ON public.profiles TO postgres;

-- ============================================================================
-- STEP 4: Verification
-- ============================================================================

-- Verify trigger exists
DO $$
DECLARE
    trigger_count int;
BEGIN
    SELECT COUNT(*) INTO trigger_count
    FROM pg_trigger
    WHERE tgrelid = 'auth.users'::regclass
      AND tgname = 'on_auth_user_created';

    IF trigger_count = 0 THEN
        RAISE EXCEPTION 'Trigger on_auth_user_created was not created successfully';
    ELSE
        RAISE NOTICE 'Trigger on_auth_user_created created successfully';
    END IF;
END $$;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON FUNCTION public.handle_new_user() IS
'Automatically creates a profile row in public.profiles when a new user signs up via Supabase Auth. Uses SECURITY DEFINER to bypass RLS during profile creation.';

COMMENT ON TRIGGER on_auth_user_created ON auth.users IS
'Fires after user signup to auto-create a profile with default role=user and is_admin=false';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- This trigger will now fire automatically whenever:
-- 1. A user signs up via Supabase Auth UI
-- 2. A user is created via Admin API
-- 3. A user is invited via email
--
-- The profile will be created with:
-- - id: Same as auth.users.id
-- - email: Same as auth.users.email
-- - role: 'user' (default)
-- - is_admin: false (default)
--
-- The trigger is idempotent - if a profile already exists, it does nothing.
-- ============================================================================
