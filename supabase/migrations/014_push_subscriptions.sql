-- Phone notifications for the team mobile app (2026-11-27)
-- One row per device that has turned notifications on. INTERNAL ONLY
-- (service-role client only). Subscriptions are deleted when a device
-- unsubscribes or the push service reports it gone.
-- NOT YET APPLIED: pending review.

create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone not null default now(),
  last_ok_at timestamp with time zone,

  member text not null check (member in ('Herbie', 'Gabriel')),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text
);

create index if not exists idx_push_subscriptions_member on push_subscriptions(member);

alter table push_subscriptions enable row level security;
revoke all on table push_subscriptions from anon, authenticated;
