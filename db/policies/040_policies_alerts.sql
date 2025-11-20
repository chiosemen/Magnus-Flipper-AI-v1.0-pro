alter table public.alerts enable row level security;

drop policy if exists alerts_read on public.alerts;
create policy alerts_read on public.alerts
for select using (exists (select 1 from app_user_orgs uo where uo.org_id = alerts.org_id));

drop policy if exists alerts_insert on public.alerts;
create policy alerts_insert on public.alerts
for insert with check (exists (select 1 from app_user_orgs uo where uo.org_id = alerts.org_id));

drop policy if exists alerts_update on public.alerts;
create policy alerts_update on public.alerts
for update using (exists (select 1 from app_user_orgs uo where uo.org_id = alerts.org_id));

drop policy if exists alerts_delete on public.alerts;
create policy alerts_delete on public.alerts
for delete using (exists (select 1 from app_user_orgs uo where uo.org_id = alerts.org_id));
