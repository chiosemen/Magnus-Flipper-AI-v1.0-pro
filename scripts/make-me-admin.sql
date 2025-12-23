-- 1. Promote user to admin via metadata
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'::jsonb
)
WHERE email = 'chi.osemen@gmail.com';

-- 2. Ensure ADMIN subscription exists
INSERT INTO user_subscriptions (user_id, tier, status)
SELECT id, 'ADMIN', 'active'
FROM auth.users
WHERE email = 'chi.osemen@gmail.com'
ON CONFLICT (user_id)
DO UPDATE SET
  tier = 'ADMIN',
  status = 'active',
  updated_at = NOW();

