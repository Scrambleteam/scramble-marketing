-- Agency Google connection (2026-10-22)
-- Scramble connects ONE agency Google account (helloscrambleteam@gmail.com)
-- that clients have added as a user on their Search Console, GA4 and Google
-- Ads. Admins then assign each client the properties their dashboard reads.
-- Replaces the per-client google_oauth_connections flow (left in place,
-- no longer written to).
-- NOT YET APPLIED: pending review.

create table if not exists agency_google_connection (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),

  -- Single row per provider; 'google' for now
  provider text not null unique default 'google',

  google_account_email text not null,
  google_account_id text not null,

  access_token text not null,
  refresh_token text not null,
  token_expires_at timestamp with time zone,
  granted_scopes text not null,

  -- Which admin clicked Connect
  connected_by_email text
);

-- Service-role only: RLS on with no policies, no grants to public roles.
-- This row holds the token that can read every client's data.
alter table agency_google_connection enable row level security;
revoke all on table agency_google_connection from anon, authenticated;

-- Per-client property assignments live on scramble_users (site_url,
-- analytics_property_id, ads_customer_id), which already exist in the live
-- database. From now on only admins set them, via /api/admin/clients/[id].
