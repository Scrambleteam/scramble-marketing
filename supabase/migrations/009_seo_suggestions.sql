-- SEO worker suggestions (2026-11-14)
-- Opportunities found by the SEO analysis for a client, from their Search
-- Console and Analytics data. Written by the analysis run and updated by the
-- team through the admin client workspace (service-role client only).
-- The worker only proposes; nothing here changes a client's website.
-- NOT YET APPLIED: pending review.

create table if not exists seo_suggestions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  scramble_user_id uuid not null references scramble_users(id) on delete cascade,

  kind text not null check (kind in ('near_page_one', 'low_ctr', 'declining', 'low_engagement')),
  -- One suggestion per client per thing found (e.g. kind + query), so a
  -- re-run updates the evidence instead of creating duplicates.
  dedupe_key text not null,
  subject text not null,
  summary text not null,
  recommendation text not null,
  evidence jsonb not null default '{}'::jsonb,
  last_seen_at timestamp with time zone not null default now(),

  status text not null default 'new' check (status in ('new', 'accepted', 'done', 'dismissed')),
  status_by text,
  status_at timestamp with time zone,

  unique (scramble_user_id, dedupe_key)
);

create index if not exists idx_seo_suggestions_client on seo_suggestions(scramble_user_id, status, last_seen_at desc);

-- Service-role only, like the other admin tables.
alter table seo_suggestions enable row level security;
revoke all on table seo_suggestions from anon, authenticated;
