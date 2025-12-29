create table if not exists geo_cache (
  postal_code text not null,
  country text not null,
  lat double precision not null,
  lng double precision not null,
  updated_at timestamptz not null default now()
);

create unique index if not exists geo_cache_postal_country_idx
  on geo_cache (postal_code, country);
