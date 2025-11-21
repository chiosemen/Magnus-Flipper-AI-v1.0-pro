-- BUCKETS
insert into storage.buckets (id, name, public)
values ('listing-images', 'listing-images', true)
on conflict (id) do nothing;

-- PUBLIC READ / OWNER WRITE policy for listing images
create policy "Listing images read"
  on storage.objects
  for select
  using (bucket_id = 'listing-images');

create policy "Listing images write by auth users"
  on storage.objects
  for insert
  with check (
    bucket_id = 'listing-images'
    and auth.role() = 'authenticated'
  );

create policy "Listing images update/delete by owner"
  on storage.objects
  for all
  using (
    bucket_id = 'listing-images'
    and auth.role() = 'authenticated'
    and owner = auth.uid()
  )
  with check (
    bucket_id = 'listing-images'
    and auth.role() = 'authenticated'
    and owner = auth.uid()
  );
