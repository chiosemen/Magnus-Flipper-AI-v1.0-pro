CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE,
  telegram_chat_id text,
  whatsapp_number text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE sniper_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  marketplace text NOT NULL,
  query text NOT NULL,
  min_price numeric,
  max_price numeric,
  location text,
  radius_km int,
  conditions jsonb,
  max_alerts_per_day int,
  is_active boolean DEFAULT true,
  scan_interval_seconds int DEFAULT 60,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  marketplace text NOT NULL,
  marketplace_listing_id text NOT NULL,
  title text,
  price numeric,
  currency text,
  location text,
  url text,
  thumbnail_url text,
  seller_id text,
  seller_score numeric,
  raw_payload jsonb,
  first_seen_at timestamptz,
  last_seen_at timestamptz,
  UNIQUE (marketplace, marketplace_listing_id)
);

CREATE TABLE profile_listings (
  profile_id uuid REFERENCES sniper_profiles(id),
  listing_id uuid REFERENCES listings(id),
  first_matched_at timestamptz,
  last_matched_at timestamptz,
  alert_sent boolean DEFAULT false,
  PRIMARY KEY (profile_id, listing_id)
);
