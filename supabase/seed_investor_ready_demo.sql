-- =====================================================
-- Investor-ready demo seed (safe to re-run)
-- - Inserts 3 saved searches (2 tech + 1 car)
-- - Inserts 40 pooled deals with images (20 tech + 10 furniture + 10 cars)
-- =====================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- -------------------------
-- Saved searches (demo)
-- -------------------------
INSERT INTO public.saved_searches (
  id,
  user_id,
  marketplace,
  name,
  params,
  status,
  created_at,
  updated_at
)
VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    NULL,
    'facebook',
    'iPhone bargains (demo)',
    jsonb_build_object(
      'keywords', jsonb_build_array('iphone', 'unlocked'),
      'maxPrice', 450,
      'maxDistanceMiles', 25,
      'location', 'London'
    ),
    'active',
    now() - interval '3 days',
    now() - interval '3 days'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    NULL,
    'facebook',
    'Gaming consoles (demo)',
    jsonb_build_object(
      'keywords', jsonb_build_array('ps5', 'xbox'),
      'maxPrice', 350,
      'maxDistanceMiles', 50,
      'location', 'Manchester'
    ),
    'active',
    now() - interval '2 days',
    now() - interval '2 days'
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    NULL,
    'cars',
    'Family cars under £9k (demo)',
    jsonb_build_object(
      'make', 'Honda',
      'model', 'Odyssey',
      'minYear', 2005,
      'maxYear', 2012,
      'maxMileage', 180000,
      'maxPrice', 9000,
      'location', 'London',
      'radiusKm', 50
    ),
    'active',
    now() - interval '1 day',
    now() - interval '1 day'
  )
ON CONFLICT (id) DO UPDATE
SET
  marketplace = EXCLUDED.marketplace,
  name = EXCLUDED.name,
  params = EXCLUDED.params,
  status = EXCLUDED.status,
  updated_at = EXCLUDED.updated_at;

-- -------------------------
-- Reset demo deals (deterministic re-run)
-- -------------------------
DELETE FROM public.deals
WHERE search_id IS NULL
  AND marketplace IN ('facebook', 'cars')
  AND data @> '{"demo": true, "source": "seed"}'::jsonb;

-- -------------------------
-- Tech deals (facebook) - 20
-- -------------------------
WITH tech AS (
  SELECT
    'facebook'::text AS marketplace,
    'facebook:uk:pool:demo-tech'::text AS pool_key,
    format('fb-demo-tech-%s', gs.i)::text AS listing_id,
    CASE
      WHEN (gs.i % 6) = 0 THEN 'iPhone 14 Pro Max 256GB Unlocked'
      WHEN (gs.i % 6) = 1 THEN 'iPhone 13 Pro 128GB - Great condition'
      WHEN (gs.i % 6) = 2 THEN 'Samsung Galaxy S23 Ultra 512GB'
      WHEN (gs.i % 6) = 3 THEN 'Google Pixel 8 Pro - Boxed'
      WHEN (gs.i % 6) = 4 THEN 'PlayStation 5 Disc Edition'
      ELSE 'Xbox Series X - Barely used'
    END AS title,
    (120 + (gs.i * 12))::numeric AS price,
    'GBP'::text AS currency,
    CASE WHEN gs.i <= 15 THEN 'London' ELSE 'Manchester' END AS location,
    format('https://example.com/demo/facebook/%s', gs.i)::text AS url,
    NULL::text AS seller_type,
    now() - make_interval(mins => (gs.i * 7)) AS posted_at,
    now() - make_interval(mins => (gs.i * 5)) AS fetched_at,
    now() + interval '7 days' AS expires_at,
    (50 + (gs.i % 50))::integer AS score,
    jsonb_build_array(
      jsonb_build_object(
        'url',
        format('https://placehold.co/800x800/png?text=Tech+%sA', gs.i),
        'width', 800,
        'height', 800
      ),
      jsonb_build_object(
        'url',
        format('https://placehold.co/800x800/png?text=Tech+%sB', gs.i),
        'width', 800,
        'height', 800
      ),
      jsonb_build_object(
        'url',
        format('https://placehold.co/800x800/png?text=Tech+%sC', gs.i),
        'width', 800,
        'height', 800
      )
    ) AS images,
    format('https://placehold.co/800x800/png?text=Tech+%sA', gs.i)::text AS primary_image,
    format('https://placehold.co/200x200/png?text=Tech+%s', gs.i)::text AS thumbnail,
    jsonb_build_object(
      'category', 'tech',
      'source', 'demo',
      'demo', true
    ) AS attributes,
    jsonb_build_object(
      'demo', true,
      'source', 'seed',
      'category', 'tech'
    ) AS data,
    now() - make_interval(mins => (gs.i * 5)) AS created_at
  FROM generate_series(1, 20) AS gs(i)
),
ins AS (
  INSERT INTO public.deals (
    marketplace,
    pool_key,
    listing_id,
    title,
    price,
    currency,
    location,
    url,
    seller_type,
    posted_at,
    fetched_at,
    expires_at,
    score,
    images,
    primary_image,
    thumbnail,
    attributes,
    data,
    created_at
  )
  SELECT
    marketplace,
    pool_key,
    listing_id,
    title,
    price,
    currency,
    location,
    url,
    seller_type,
    posted_at,
    fetched_at,
    expires_at,
    score,
    images,
    primary_image,
    thumbnail,
    attributes,
    data,
    created_at
  FROM tech
  ON CONFLICT (marketplace, listing_id) DO UPDATE
  SET
    pool_key = EXCLUDED.pool_key,
    title = EXCLUDED.title,
    price = EXCLUDED.price,
    currency = EXCLUDED.currency,
    location = EXCLUDED.location,
    url = EXCLUDED.url,
    posted_at = EXCLUDED.posted_at,
    fetched_at = EXCLUDED.fetched_at,
    expires_at = EXCLUDED.expires_at,
    score = EXCLUDED.score,
    images = EXCLUDED.images,
    primary_image = EXCLUDED.primary_image,
    thumbnail = EXCLUDED.thumbnail,
    attributes = EXCLUDED.attributes,
    data = EXCLUDED.data,
    created_at = EXCLUDED.created_at
  RETURNING 1
)
SELECT count(*) AS inserted_or_updated FROM ins;

-- -------------------------
-- Furniture deals (facebook) - 10
-- -------------------------
WITH furniture AS (
  SELECT
    'facebook'::text AS marketplace,
    'facebook:uk:pool:demo-furniture'::text AS pool_key,
    format('fb-demo-furn-%s', gs.i)::text AS listing_id,
    CASE
      WHEN (gs.i % 6) = 0 THEN 'Corner sofa - excellent condition'
      WHEN (gs.i % 6) = 1 THEN 'Solid oak dining table + 4 chairs'
      WHEN (gs.i % 6) = 2 THEN 'IKEA MALM chest of drawers'
      WHEN (gs.i % 6) = 3 THEN 'King size bed frame with headboard'
      WHEN (gs.i % 6) = 4 THEN 'Modern coffee table (glass)'
      ELSE 'Office chair ergonomic - like new'
    END AS title,
    (40 + (gs.i * 35))::numeric AS price,
    'GBP'::text AS currency,
    CASE WHEN (gs.i % 2) = 0 THEN 'London' ELSE 'Leeds' END AS location,
    format('https://example.com/demo/facebook/furniture/%s', gs.i)::text AS url,
    NULL::text AS seller_type,
    now() - make_interval(mins => (gs.i * 13)) AS posted_at,
    now() - make_interval(mins => (gs.i * 9)) AS fetched_at,
    now() + interval '10 days' AS expires_at,
    (45 + (gs.i * 4))::integer AS score,
    jsonb_build_array(
      jsonb_build_object(
        'url',
        format('https://placehold.co/800x800/png?text=Furniture+%sA', gs.i),
        'width', 800,
        'height', 800
      ),
      jsonb_build_object(
        'url',
        format('https://placehold.co/800x800/png?text=Furniture+%sB', gs.i),
        'width', 800,
        'height', 800
      ),
      jsonb_build_object(
        'url',
        format('https://placehold.co/800x800/png?text=Furniture+%sC', gs.i),
        'width', 800,
        'height', 800
      )
    ) AS images,
    format('https://placehold.co/800x800/png?text=Furniture+%sA', gs.i)::text AS primary_image,
    format('https://placehold.co/200x200/png?text=Furn+%s', gs.i)::text AS thumbnail,
    jsonb_build_object(
      'category', 'furniture',
      'source', 'demo',
      'demo', true
    ) AS attributes,
    jsonb_build_object(
      'demo', true,
      'source', 'seed',
      'category', 'furniture'
    ) AS data,
    now() - make_interval(mins => (gs.i * 9)) AS created_at
  FROM generate_series(1, 10) AS gs(i)
),
ins AS (
  INSERT INTO public.deals (
    marketplace,
    pool_key,
    listing_id,
    title,
    price,
    currency,
    location,
    url,
    seller_type,
    posted_at,
    fetched_at,
    expires_at,
    score,
    images,
    primary_image,
    thumbnail,
    attributes,
    data,
    created_at
  )
  SELECT
    marketplace,
    pool_key,
    listing_id,
    title,
    price,
    currency,
    location,
    url,
    seller_type,
    posted_at,
    fetched_at,
    expires_at,
    score,
    images,
    primary_image,
    thumbnail,
    attributes,
    data,
    created_at
  FROM furniture
  ON CONFLICT (marketplace, listing_id) DO UPDATE
  SET
    pool_key = EXCLUDED.pool_key,
    title = EXCLUDED.title,
    price = EXCLUDED.price,
    currency = EXCLUDED.currency,
    location = EXCLUDED.location,
    url = EXCLUDED.url,
    posted_at = EXCLUDED.posted_at,
    fetched_at = EXCLUDED.fetched_at,
    expires_at = EXCLUDED.expires_at,
    score = EXCLUDED.score,
    images = EXCLUDED.images,
    primary_image = EXCLUDED.primary_image,
    thumbnail = EXCLUDED.thumbnail,
    attributes = EXCLUDED.attributes,
    data = EXCLUDED.data,
    created_at = EXCLUDED.created_at
  RETURNING 1
)
SELECT count(*) AS inserted_or_updated FROM ins;

-- -------------------------
-- Car deals (cars) - 10
-- -------------------------
WITH cars AS (
  SELECT
    'cars'::text AS marketplace,
    'cars:uk:pool:demo-cars'::text AS pool_key,
    format('car-demo-%s', gs.i)::text AS listing_id,
    CASE
      WHEN (gs.i % 5) = 0 THEN '2007 Honda Odyssey EX - Clean title'
      WHEN (gs.i % 5) = 1 THEN '2010 Honda Odyssey - Family van'
      WHEN (gs.i % 5) = 2 THEN '2009 Toyota Prius - Low running costs'
      WHEN (gs.i % 5) = 3 THEN '2011 Ford Focus - Great commuter'
      ELSE '2008 BMW 320d - Drives well'
    END AS title,
    (2500 + (gs.i * 650))::numeric AS price,
    'GBP'::text AS currency,
    CASE WHEN (gs.i % 2) = 0 THEN 'London' ELSE 'Birmingham' END AS location,
    format('https://example.com/demo/cars/%s', gs.i)::text AS url,
    NULL::text AS seller_type,
    now() - make_interval(mins => (gs.i * 11)) AS posted_at,
    now() - make_interval(mins => (gs.i * 9)) AS fetched_at,
    now() + interval '10 days' AS expires_at,
    (60 + (gs.i * 3))::integer AS score,
    jsonb_build_array(
      jsonb_build_object(
        'url',
        format('https://placehold.co/800x500/png?text=Car+%sA', gs.i),
        'width', 800,
        'height', 500
      ),
      jsonb_build_object(
        'url',
        format('https://placehold.co/800x500/png?text=Car+%sB', gs.i),
        'width', 800,
        'height', 500
      ),
      jsonb_build_object(
        'url',
        format('https://placehold.co/800x500/png?text=Car+%sC', gs.i),
        'width', 800,
        'height', 500
      )
    ) AS images,
    format('https://placehold.co/800x500/png?text=Car+%sA', gs.i)::text AS primary_image,
    format('https://placehold.co/240x150/png?text=Car+%s', gs.i)::text AS thumbnail,
    jsonb_build_object(
      'category', 'car',
      'year', (2006 + gs.i)::integer,
      'make', CASE WHEN (gs.i % 5) IN (0,1) THEN 'Honda' WHEN (gs.i % 5) = 2 THEN 'Toyota' WHEN (gs.i % 5) = 3 THEN 'Ford' ELSE 'BMW' END,
      'model', CASE WHEN (gs.i % 5) IN (0,1) THEN 'Odyssey' WHEN (gs.i % 5) = 2 THEN 'Prius' WHEN (gs.i % 5) = 3 THEN 'Focus' ELSE '320d' END,
      'mileage', (80000 + (gs.i * 12000))::integer,
      'transmission', CASE WHEN (gs.i % 3) = 0 THEN 'automatic' ELSE 'manual' END,
      'source', 'demo',
      'demo', true
    ) AS attributes,
    jsonb_build_object(
      'demo', true,
      'source', 'seed',
      'category', 'car'
    ) AS data,
    now() - make_interval(mins => (gs.i * 9)) AS created_at
  FROM generate_series(1, 10) AS gs(i)
),
ins AS (
  INSERT INTO public.deals (
    marketplace,
    pool_key,
    listing_id,
    title,
    price,
    currency,
    location,
    url,
    seller_type,
    posted_at,
    fetched_at,
    expires_at,
    score,
    images,
    primary_image,
    thumbnail,
    attributes,
    data,
    created_at
  )
  SELECT
    marketplace,
    pool_key,
    listing_id,
    title,
    price,
    currency,
    location,
    url,
    seller_type,
    posted_at,
    fetched_at,
    expires_at,
    score,
    images,
    primary_image,
    thumbnail,
    attributes,
    data,
    created_at
  FROM cars
  ON CONFLICT (marketplace, listing_id) DO UPDATE
  SET
    pool_key = EXCLUDED.pool_key,
    title = EXCLUDED.title,
    price = EXCLUDED.price,
    currency = EXCLUDED.currency,
    location = EXCLUDED.location,
    url = EXCLUDED.url,
    posted_at = EXCLUDED.posted_at,
    fetched_at = EXCLUDED.fetched_at,
    expires_at = EXCLUDED.expires_at,
    score = EXCLUDED.score,
    images = EXCLUDED.images,
    primary_image = EXCLUDED.primary_image,
    thumbnail = EXCLUDED.thumbnail,
    attributes = EXCLUDED.attributes,
    data = EXCLUDED.data,
    created_at = EXCLUDED.created_at
  RETURNING 1
)
SELECT count(*) AS inserted_or_updated FROM ins;
