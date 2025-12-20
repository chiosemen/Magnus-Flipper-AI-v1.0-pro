-- =====================================================
-- Seed: Additional region-specific templates (idempotent)
-- - Expands starter set to >= 5 templates per region (US + UK).
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
      'c2a3e5b1-9f2a-4d9a-9a7f-6a86c8a7c3d1',
      'Laptop flips',
      'US: MacBook flips (anti-spam)',
      'facebook',
      '{
        "keywords": ["macbook", "macbook pro", "macbook air", "mac book"],
        "minPrice": 120,
        "maxPrice": 1200,
        "excludeKeywords": ["icloud", "locked", "mdm", "parts", "spares", "broken", "cracked"],
        "query": "macbook"
      }'::jsonb,
      ARRAY['laptops','apple','higher-margin']::text[],
      'US',
      NULL
    ),
    (
      '7d14c2d7-4d10-4e4d-8e33-8a9b9c5e1f2a',
      'Car flips',
      'US: Minivan flips (Odyssey/Sienna under $5k)',
      'cars',
      '{
        "make": "Honda,Toyota",
        "model": "Odyssey,Sienna",
        "minYear": 2008,
        "maxYear": 2016,
        "maxMileage": 180000,
        "maxPrice": 5000,
        "location": "Chicago",
        "radiusKm": 80,
        "excludeKeywords": ["salvage", "rebuilt", "parts", "mechanic special"]
      }'::jsonb,
      ARRAY['cars','minivan','family']::text[],
      'US',
      NULL
    ),
    (
      '2a0f7b8d-3b65-4c1e-9c2b-2c0e6a5f1b7e',
      'Laptop flips',
      'UK: MacBook flips (anti-spam)',
      'facebook',
      '{
        "keywords": ["macbook", "macbook pro", "macbook air", "mac book"],
        "minPrice": 100,
        "maxPrice": 1000,
        "excludeKeywords": ["icloud", "locked", "mdm", "parts", "spares", "broken", "cracked"],
        "query": "macbook"
      }'::jsonb,
      ARRAY['laptops','apple','higher-margin']::text[],
      'UK',
      NULL
    ),
    (
      'f3c9a6d4-91e6-4fb8-a4d7-0f2c3b4a5d6e',
      'Car flips',
      'UK: Used cars under £3k (Gumtree Midlands)',
      'gumtree',
      '{
        "keywords": ["car", "petrol", "diesel"],
        "minPrice": 0,
        "maxPrice": 3000,
        "location": "Birmingham",
        "radiusKm": 80,
        "excludeKeywords": ["salvage", "write-off", "spares", "parts"]
      }'::jsonb,
      ARRAY['cars','budget','midlands']::text[],
      'UK',
      NULL
    )
  ON CONFLICT (id) DO NOTHING;
END $$;

