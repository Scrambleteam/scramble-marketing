-- Campaign change log (2026-11-12)
-- Records changes to a client's Google Ads campaigns: what was proposed,
-- who approved it, and when it was applied. Written and read only by the
-- admin client workspace through the service-role client.
-- NOT YET APPLIED: pending review.

create table if not exists campaign_changes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  scramble_user_id uuid not null references scramble_users(id) on delete cascade,

  google_customer_id text,
  campaign_name text,
  change_type text not null check (change_type in ('budget', 'status', 'bid', 'keyword', 'ad_copy', 'other')),
  summary text not null check (char_length(summary) between 1 and 500),
  before_value text,
  after_value text,

  status text not null default 'proposed' check (status in ('proposed', 'approved', 'rejected', 'applied')),
  proposed_by text not null,
  approved_by text,
  approved_at timestamp with time zone,
  applied_by text,
  applied_at timestamp with time zone
);

create index if not exists idx_campaign_changes_client on campaign_changes(scramble_user_id, created_at desc);

-- Service-role only, like the other admin tables.
alter table campaign_changes enable row level security;
revoke all on table campaign_changes from anon, authenticated;
