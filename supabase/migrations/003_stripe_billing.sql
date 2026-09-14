-- Stripe billing fields on scramble_users (Herbie 2026-09-14)

alter table scramble_users
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists subscription_status text default 'incomplete',
  add column if not exists current_period_end timestamp with time zone;

create index if not exists idx_scramble_users_stripe_customer on scramble_users(stripe_customer_id);
