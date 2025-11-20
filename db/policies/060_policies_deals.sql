alter table public.deals enable row level security;

drop policy if exists deals_read on public.deals;
create policy deals_read on public.deals
for select using (exists (select 1 from app_user_orgs uo where uo.org_id = deals.org_id));

drop policy if exists deals_insert on public.deals;
create policy deals_insert on public.deals
for insert with check (exists (select 1 from app_user_orgs uo where uo.org_id = deals.org_id));

drop policy if exists deals_update on public.deals;
create policy deals_update on public.deals
for update using (exists (select 1 from app_user_orgs uo where uo.org_id = deals.org_id));

drop policy if exists deals_delete on public.deals;
create policy deals_delete on public.deals
for delete using (exists (select 1 from app_user_orgs uo where uo.org_id = deals.org_id));
