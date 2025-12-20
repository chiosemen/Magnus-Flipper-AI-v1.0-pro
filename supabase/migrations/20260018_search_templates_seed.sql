-- =====================================================
-- Seed: Winning Templates library (idempotent)
-- - Inserts a small starter set of proven templates (US + UK variants)
-- - Uses fixed UUIDs so this seed can be re-run safely.
-- =====================================================

DO $$
BEGIN
  IF to_regclass('public.search_templates') IS NULL THEN
    RAISE NOTICE 'Skipping template seed: public.search_templates does not exist';
    RETURN;
  END IF;

  INSERT INTO public.search_templates (
    id, category, title, marketplace, params_json, tags, region, created_by
  ) VALUES
    (
      '0c3f1b5f-1a38-4a5f-8f9a-3a3b6d98a5c1',
      'Phone flips',
      'UK: iPhone flips (anti-spam)',
      'facebook',
      '{
        "keywords": ["iphone", "ipad", "apple watch"],
        "minPrice": 30,
        "maxPrice": 600,
        "excludeKeywords": ["icloud", "locked", "activation", "cracked", "spares", "parts"],
        "query": "iphone"
      }'::jsonb,
      ARRAY['phones','apple','quick-turn']::text[],
      'UK',
      NULL
    ),
    (
      '9b2d2c2d-8a10-4c01-8c31-8cf1f5d5d6d2',
      'Phone flips',
      'US: iPhone flips (anti-spam)',
      'facebook',
      '{
        "keywords": ["iphone", "ipad", "apple watch"],
        "minPrice": 40,
        "maxPrice": 700,
        "excludeKeywords": ["icloud", "locked", "activation", "cracked", "spares", "parts"],
        "query": "iphone"
      }'::jsonb,
      ARRAY['phones','apple','quick-turn']::text[],
      'US',
      NULL
    ),
    (
      'b4b5e6d7-5a73-4c2b-9c2f-1d3c4b5a6f70',
      'Couch flips',
      'UK: Sofa flips (pickup-only)',
      'facebook',
      '{
        "keywords": ["sofa", "couch", "corner sofa"],
        "minPrice": 0,
        "maxPrice": 180,
        "excludeKeywords": ["free", "broken", "damaged", "delivery only"],
        "query": "sofa"
      }'::jsonb,
      ARRAY['furniture','sofa','local']::text[],
      'UK',
      NULL
    ),
    (
      'f0c2c6a2-9b0f-4f0b-a3b0-2c1f8e9d7a61',
      'Couch flips',
      'US: Sofa flips (pickup-only)',
      'facebook',
      '{
        "keywords": ["sofa", "couch", "sectional"],
        "minPrice": 0,
        "maxPrice": 220,
        "excludeKeywords": ["free", "broken", "damaged", "delivery only"],
        "query": "sofa"
      }'::jsonb,
      ARRAY['furniture','sofa','local']::text[],
      'US',
      NULL
    ),
    (
      '4cba0b2a-7c7d-4c3b-bb4a-8d0f6f7d9e10',
      'Car flips',
      'UK: Budget commuter cars',
      'cars',
      '{
        "make": "",
        "model": "",
        "minYear": 2010,
        "maxYear": 2017,
        "maxMileage": 130000,
        "maxPrice": 4500,
        "location": "London",
        "radiusKm": 50,
        "excludeKeywords": ["salvage", "write-off", "spares", "parts"]
      }'::jsonb,
      ARRAY['cars','budget','commuter']::text[],
      'UK',
      NULL
    ),
    (
      '2f7e0a12-6f09-4c0f-9e0a-7b6e5d4c3b2a',
      'Car flips',
      'US: Budget commuter cars',
      'cars',
      '{
        "make": "",
        "model": "",
        "minYear": 2011,
        "maxYear": 2018,
        "maxMileage": 160000,
        "maxPrice": 6000,
        "location": "",
        "radiusKm": 80,
        "excludeKeywords": ["salvage", "rebuilt", "parts"]
      }'::jsonb,
      ARRAY['cars','budget','commuter']::text[],
      'US',
      NULL
    )
  ON CONFLICT (id) DO NOTHING;
END $$;

