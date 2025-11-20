-- Enable required extensions (if not already)
create extension if not exists pgcrypto;

-- Helper: current user id (Supabase)
create or replace function app_current_user_id()
returns uuid language sql stable as $$
  select auth.uid()
$$;

-- Helper: is user a member of an org?
create or replace function app_is_org_member(check_org_id uuid)
returns boolean language sql stable as $$
  select exists (
    select 1
    from public.memberships m
    where m.org_id = check_org_id
      and m.user_id = app_current_user_id()
  )
$$;

-- Helper: orgs for current user (used in policies)
create or replace view app_user_orgs as
select m.org_id
from public.memberships m
where m.user_id = app_current_user_id();

-- (Optional) Tighten search_path for security
alter database current set search_path = public, extensions;
