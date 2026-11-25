-- Google Ads response cache (2026-11-25)
-- Ads data is fetched at most once a day per account (metrics) so we stay
-- inside the Ads API rate limits. If Google refuses, the last good copy is
-- shown instead. Service-role client only.
-- NOT YET APPLIED: pending review.

create table if not exists ads_cache (
  cache_key text primary key,
  data jsonb not null,
  fetched_at timestamp with time zone not null default now()
);

alter table ads_cache enable row level security;
revoke all on table ads_cache from anon, authenticated;
