-- Users table
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  telegram_chat_id text,
  created_at timestamptz default now()
);

-- Scan profiles (user-defined snipe configs)
create table if not exists public.scan_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  marketplace text not null, -- 'fb', 'vinted', 'gumtree', etc.
  query text not null,
  min_price numeric,
  max_price numeric,
  location text,
  config jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- Listings (normalized listing data)
create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  external_id text not null,
  marketplace text not null,
  title text not null,
  url text not null,
  image_url text,
  price numeric,
  currency text default 'GBP',
  location text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create unique index if not exists listings_marketplace_external_id_idx
  on public.listings(marketplace, external_id);

-- Scores (valuation + sniper engine)
create table if not exists public.listing_scores (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  profile_id uuid references public.scan_profiles(id) on delete set null,
  undervalue_score numeric,
  quick_flip_score numeric,
  demand_velocity_score numeric,
  rarity_score numeric,
  profitability_score numeric,
  estimated_resale_value numeric,
  score_payload jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- Alerts log
create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  profile_id uuid references public.scan_profiles(id) on delete set null,
  channel text not null, -- 'telegram', 'email', 'sms'
  payload jsonb not null,
  sent_at timestamptz default now()
);
