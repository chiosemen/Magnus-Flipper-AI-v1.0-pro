-- Seed: Promote admin user
-- Date: 2025-12-22
-- Purpose: Promote chinye.osemene@icloud.com to admin role

-- ============================================================================
-- PROMOTE ADMIN USER
-- ============================================================================

-- Insert or update profile for admin user
INSERT INTO public.profiles (id, email, role, is_admin)
VALUES (
    'da43fd6b-3655-4693-b078-f918794034de'::uuid,
    'chinye.osemene@icloud.com',
    'admin',
    true
)
ON CONFLICT (id)
DO UPDATE SET
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    is_admin = EXCLUDED.is_admin,
    updated_at = now();

-- Verify the update
DO $$
DECLARE
    admin_count int;
BEGIN
    SELECT COUNT(*) INTO admin_count
    FROM public.profiles
    WHERE id = 'da43fd6b-3655-4693-b078-f918794034de'::uuid
      AND is_admin = true;

    IF admin_count = 0 THEN
        RAISE EXCEPTION 'Admin promotion failed for user da43fd6b-3655-4693-b078-f918794034de';
    ELSE
        RAISE NOTICE 'Successfully promoted chinye.osemene@icloud.com to admin';
    END IF;
END $$;
