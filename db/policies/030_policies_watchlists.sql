alter table public.watchlists enable row level security;

-- SELECT: only rows in your orgs
drop policy if exists wl_read on public.watchlists;
create policy wl_read on public.watchlists
for select using (exists (select 1 from app_user_orgs uo where uo.org_id = watchlists.org_id));

-- INSERT: ensure row org_id is one of your orgs
drop policy if exists wl_insert on public.watchlists;
create policy wl_insert on public.watchlists
for insert with check (exists (select 1 from app_user_orgs uo where uo.org_id = watchlists.org_id));

-- UPDATE/DELETE: same constraint
drop policy if exists wl_update on public.watchlists;
create policy wl_update on public.watchlists
for update using (exists (select 1 from app_user_orgs uo where uo.org_id = watchlists.org_id));

drop policy if exists wl_delete on public.watchlists;
create policy wl_delete on public.watchlists
for delete using (exists (select 1 from app_user_orgs uo where uo.org_id = watchlists.org_id));
