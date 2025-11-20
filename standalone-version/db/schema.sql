create extension if not exists "uuid-ossp";
create table if not exists public.profiles (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  username text,
  avatar_url text,
  created_at timestamptz default now()
);
create table if not exists public.flips (
  id bigserial primary key,
  user_id uuid references profiles(id) on delete cascade,
  title text not null,
  buy numeric(10,2),
  sell numeric(10,2),
  yield_pct numeric(5,2),
  category text,
  created_at timestamptz default now()
);
create table if not exists public.wins (
  id bigserial primary key,
  flip_id bigint references flips(id) on delete cascade,
  community_posted boolean default false,
  platform text,
  created_at timestamptz default now()
);
create view if not exists public.leaderboard as
  select p.username, count(f.id) as total_flips,
         avg(f.yield_pct) as avg_yield
  from profiles p
  join flips f on f.user_id = p.id
  group by p.username
  order by avg_yield desc;
alter table profiles enable row level security;
alter table flips enable row level security;
alter table wins enable row level security;
