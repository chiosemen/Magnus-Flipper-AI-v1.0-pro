-- USERS (app-level mirror of auth.users)
create table if not exists public.users (
  id uuid primary key,
  email text,
  created_at timestamptz default now()
);

-- Mirror auth.users into public.users on sign-up (optional; can be handled in app)
-- Or just store app-specific metadata here and rely on auth.users as source of truth.

-- TELEGRAM LINKING
create table if not exists public.telegram_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  telegram_chat_id text not null unique,
  linked_at timestamptz default now(),
  is_active boolean default true
);

-- SNIPER PROFILES
create table if not exists public.sniper_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  marketplace text not null,           -- 'fb', 'vinted', 'gumtree', etc.
  search_term text not null,
  min_price numeric,
  max_price numeric,
  currency text default 'GBP',
  location text,
  country text,
  is_active boolean default true,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- MARKETPLACE LISTINGS SNAPSHOT
create table if not exists public.marketplace_listings (
  id uuid primary key default gen_random_uuid(),
  marketplace text not null,
  external_id text not null,
  url text not null,
  title text,
  price numeric,
  currency text default 'GBP',
  location text,
  thumbnail_url text,
  raw_payload jsonb default '{}'::jsonb,
  first_seen_at timestamptz default now(),
  last_seen_at timestamptz default now()
);

create unique index if not exists uniq_marketplace_listing
  on public.marketplace_listings(marketplace, external_id);

-- ALERTS
create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  profile_id uuid not null,
  listing_id uuid not null,
  channel text not null,  -- 'telegram', 'email', 'sms', etc.
  payload jsonb not null,
  score numeric,
  created_at timestamptz default now(),
  sent_at timestamptz
);

-- BASIC FKs (no cascades to avoid surprises)
alter table public.telegram_links
  add constraint fk_telegram_links_user
  foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.sniper_profiles
  add constraint fk_sniper_profiles_user
  foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.alerts
  add constraint fk_alerts_user
  foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.alerts
  add constraint fk_alerts_profile
  foreign key (profile_id) references public.sniper_profiles(id) on delete cascade;

alter table public.alerts
  add constraint fk_alerts_listing
  foreign key (listing_id) references public.marketplace_listings(id) on delete cascade;

-- Enable RLS
alter table public.telegram_links enable row level security;
alter table public.sniper_profiles enable row level security;
alter table public.marketplace_listings enable row level security;
alter table public.alerts enable row level security;

-- Only owners can see their own telegram links
create policy "Own telegram links"
  on public.telegram_links
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Only owners can see/edit their sniper profiles
create policy "Own sniper profiles"
  on public.sniper_profiles
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Listings are read-only & globally viewable
create policy "Read listings"
  on public.marketplace_listings
  for select
  using (true);

-- Alerts visible only to owner
create policy "Own alerts"
  on public.alerts
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
