-- Seed initial Facebook pools (idempotent).
-- UK region, 2 cities (London/Manchester), 1 category (phones).
-- Canonical pool registry: public.deal_pools

INSERT INTO public.deal_pools (id, region, marketplace, pool_key, params, ttl_seconds, enabled, status, priority)
VALUES
  (
    'fb1d87b0-7536-4761-a64f-0279a7283dd4',
    'UK',
    'facebook',
    'facebook:uk:london:phones:iphone',
    jsonb_build_object(
      'name', 'UK London phones - iPhone',
      'market', 'UK',
      'city', 'London',
      'category', 'phones',
      'query_template', 'iphone',
      'radius_km', 25,
      'max_pages', 3
    ),
    3600,
    true,
    'healthy',
    3
  ),
  (
    'c5c71e5b-a6db-4efe-b6b6-b2c4f2b5c0b2',
    'UK',
    'facebook',
    'facebook:uk:london:phones:samsung-galaxy',
    jsonb_build_object(
      'name', 'UK London phones - Samsung Galaxy',
      'market', 'UK',
      'city', 'London',
      'category', 'phones',
      'query_template', 'samsung galaxy',
      'radius_km', 25,
      'max_pages', 3
    ),
    3600,
    true,
    'healthy',
    3
  ),
  (
    'cf8dae2c-929e-491f-8b2d-ad378555d290',
    'UK',
    'facebook',
    'facebook:uk:london:phones:pixel',
    jsonb_build_object(
      'name', 'UK London phones - Pixel',
      'market', 'UK',
      'city', 'London',
      'category', 'phones',
      'query_template', 'pixel',
      'radius_km', 25,
      'max_pages', 3
    ),
    3600,
    true,
    'healthy',
    3
  ),
  (
    '3fa1ad59-33e7-45b7-9c22-09bfaad21fb2',
    'UK',
    'facebook',
    'facebook:uk:manchester:phones:iphone',
    jsonb_build_object(
      'name', 'UK Manchester phones - iPhone',
      'market', 'UK',
      'city', 'Manchester',
      'category', 'phones',
      'query_template', 'iphone',
      'radius_km', 25,
      'max_pages', 3
    ),
    3600,
    true,
    'healthy',
    3
  ),
  (
    '565d7c9e-69b1-43b5-8394-3d9883da4d13',
    'UK',
    'facebook',
    'facebook:uk:manchester:phones:samsung-galaxy',
    jsonb_build_object(
      'name', 'UK Manchester phones - Samsung Galaxy',
      'market', 'UK',
      'city', 'Manchester',
      'category', 'phones',
      'query_template', 'samsung galaxy',
      'radius_km', 25,
      'max_pages', 3
    ),
    3600,
    true,
    'healthy',
    3
  ),
  (
    '42c0b0f3-91d3-4c4d-a8f3-421d3d037107',
    'UK',
    'facebook',
    'facebook:uk:manchester:phones:pixel',
    jsonb_build_object(
      'name', 'UK Manchester phones - Pixel',
      'market', 'UK',
      'city', 'Manchester',
      'category', 'phones',
      'query_template', 'pixel',
      'radius_km', 25,
      'max_pages', 3
    ),
    3600,
    true,
    'healthy',
    3
  )
ON CONFLICT (id) DO NOTHING;
