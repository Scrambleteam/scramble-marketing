-- Client baselines (2026-11-28)
-- The value of each headline measure the first time we could measure it for a
-- client (their last 28 days at that point), so the dashboard and reports can
-- say "since we started". One row per client per measure. Restarting a
-- baseline deletes its rows; they are captured again on the next load.
-- Service-role only.
-- NOT YET APPLIED: pending review.

create table if not exists client_baselines (
  scramble_user_id uuid not null references scramble_users(id) on delete cascade,
  measure_key text not null check (measure_key in ('enquiries', 'search_clicks', 'page_one_keywords', 'ad_spend')),
  value numeric not null,
  period_start date,
  period_end date,
  captured_at timestamp with time zone not null default now(),
  primary key (scramble_user_id, measure_key)
);

alter table client_baselines enable row level security;
revoke all on table client_baselines from anon, authenticated;
