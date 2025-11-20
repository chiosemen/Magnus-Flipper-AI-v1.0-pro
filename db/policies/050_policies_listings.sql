-- If listings are shared across orgs (public marketplace), do not enable RLS.
-- If proprietary, scope by org_id like others:
-- alter table public.listings enable row level security;
-- ...and then mirror the watchlists pattern.

-- Recommended indexes for idempotency & ingest speeds:
create index if not exists idx_listings_source_listing_id on public.listings(source, listing_id);
create unique index if not exists uidx_listings_source_listing on public.listings(source, listing_id);
