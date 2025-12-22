-- Make chi.osemen@gmail.com an admin
-- This script grants admin access by:
-- 1. Setting user_metadata.role to 'admin'
-- 2. Creating/updating user_subscriptions record with tier='ADMIN' and status='active'

-- Step 1: Update user metadata to set role='admin'
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'::jsonb
)
WHERE email = 'chi.osemen@gmail.com';

-- Step 2: Insert or update user_subscriptions record
-- First, get the user_id
DO $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Get the user ID
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = 'chi.osemen@gmail.com';

  IF target_user_id IS NOT NULL THEN
    -- Upsert the subscription record
    INSERT INTO user_subscriptions (
      user_id,
      tier,
      status,
      created_at,
      updated_at
    )
    VALUES (
      target_user_id,
      'ADMIN',
      'active',
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id)
    DO UPDATE SET
      tier = 'ADMIN',
      status = 'active',
      updated_at = NOW();

    RAISE NOTICE 'Admin access granted to user: %', target_user_id;
  ELSE
    RAISE EXCEPTION 'User with email chi.osemen@gmail.com not found';
  END IF;
END $$;
