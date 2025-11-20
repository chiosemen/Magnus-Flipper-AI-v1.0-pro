alter table public.organizations enable row level security;

-- Read organizations only if user is a member
drop policy if exists org_read on public.organizations;
create policy org_read on public.organizations
for select using (app_is_org_member(id));

-- Insert organizations: allow any authenticated user to create their own org
drop policy if exists org_insert on public.organizations;
create policy org_insert on public.organizations
for insert with check (app_current_user_id() is not null);

-- Update/Delete organizations: member with role guard (optional)
-- Adjust if you store roles in memberships.
drop policy if exists org_update on public.organizations;
create policy org_update on public.organizations
for update using (app_is_org_member(id));

drop policy if exists org_delete on public.organizations;
create policy org_delete on public.organizations
for delete using (app_is_org_member(id));
