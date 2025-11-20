-- Deals table
create table if not exists public.deals (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  price numeric(10,2) not null,
  currency text default 'USD',
  score integer check (score >= 0 and score <= 100),
  url text,
  marketplace text,
  category text,
  image_url text,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Watchlists table
create table if not exists public.watchlists (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  keywords text[] default '{}',
  min_price numeric(10,2),
  max_price numeric(10,2),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Alerts table
create table if not exists public.alerts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  deal_id uuid references public.deals(id) on delete cascade,
  channel text check (channel in ('email', 'sms', 'push')),
  status text default 'pending' check (status in ('pending', 'sent', 'failed')),
  sent_at timestamptz,
  created_at timestamptz default now()
);

-- Indexes for performance
create index if not exists idx_deals_score on public.deals(score desc);
create index if not exists idx_deals_created_at on public.deals(created_at desc);
create index if not exists idx_watchlists_user_id on public.watchlists(user_id);
create index if not exists idx_alerts_user_id on public.alerts(user_id);
create index if not exists idx_alerts_deal_id on public.alerts(deal_id);

-- Enable RLS
alter table public.deals enable row level security;
alter table public.watchlists enable row level security;
alter table public.alerts enable row level security;

-- RLS Policies

-- Deals: Public read access, no write for now
create policy "Deals are viewable by everyone"
  on public.deals for select
  using (true);

-- Watchlists: Users can only access their own watchlists
create policy "Users can view their own watchlists"
  on public.watchlists for select
  using (auth.uid() = user_id);

create policy "Users can create their own watchlists"
  on public.watchlists for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own watchlists"
  on public.watchlists for update
  using (auth.uid() = user_id);

create policy "Users can delete their own watchlists"
  on public.watchlists for delete
  using (auth.uid() = user_id);

-- Alerts: Users can only access their own alerts
create policy "Users can view their own alerts"
  on public.alerts for select
  using (auth.uid() = user_id);

create policy "Users can create their own alerts"
  on public.alerts for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own alerts"
  on public.alerts for update
  using (auth.uid() = user_id);

create policy "Users can delete their own alerts"
  on public.alerts for delete
  using (auth.uid() = user_id);
