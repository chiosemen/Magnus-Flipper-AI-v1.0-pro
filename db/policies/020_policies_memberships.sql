alter table public.memberships enable row level security;

-- Read memberships of orgs you belong to
drop policy if exists mem_read on public.memberships;
create policy mem_read on public.memberships
for select using (app_is_org_member(org_id));

-- Insert: allow adding yourself to an org you already belong to (usually done by admins)
drop policy if exists mem_insert on public.memberships;
create policy mem_insert on public.memberships
for insert with check (
  app_is_org_member(org_id) -- or allow org owners only if you manage roles
);

-- Update/Delete: same guard
drop policy if exists mem_update on public.memberships;
create policy mem_update on public.memberships
for update using (app_is_org_member(org_id));

drop policy if exists mem_delete on public.memberships;
create policy mem_delete on public.memberships
for delete using (app_is_org_member(org_id));
