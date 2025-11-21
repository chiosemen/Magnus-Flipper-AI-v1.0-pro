-- Enable RLS
alter table public.users enable row level security;
alter table public.scan_profiles enable row level security;
alter table public.listings enable row level security;
alter table public.listing_scores enable row level security;
alter table public.alerts enable row level security;

-- Users: each user sees only self
create policy "Users can see their own row"
  on public.users
  for select
  using (auth.uid() = id);

-- Scan profiles: owner-only
create policy "Users see own scan profiles"
  on public.scan_profiles
  for select using (auth.uid() = user_id);

create policy "Users manage own scan profiles"
  on public.scan_profiles
  for all using (auth.uid() = user_id)
                 with check (auth.uid() = user_id);

-- Listings: readable by all authenticated (no write from client)
create policy "Listings readable"
  on public.listings
  for select using (true);

-- Scores: readable, no client writes
create policy "Listing scores readable"
  on public.listing_scores
  for select using (true);

-- Alerts: users only see their own
create policy "Users see own alerts"
  on public.alerts
  for select using (auth.uid() = user_id);
