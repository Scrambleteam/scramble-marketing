-- Meta (Facebook/Instagram) Ads OAuth connections for clients (Herbie 2026-09-25)
-- Mirrors 001_google_oauth.sql. Meta has no refresh-token grant for a standard
-- user access token -- the best available is a "long-lived" token good for
-- about 60 days, after which the client has to click "Connect" again. There
-- is no silent refresh; token_expires_at is what the status route uses to
-- tell the front end when to prompt a reconnect.

create table if not exists meta_oauth_connections (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),

  -- Client reference (from clients table)
  client_id text not null,

  -- Meta account info
  meta_account_name text not null,
  meta_account_id text not null,

  -- Token storage (encrypted at rest by Supabase). Long-lived user access
  -- token only -- Meta does not issue a refresh token for this flow.
  access_token text not null,
  token_expires_at timestamp with time zone,

  -- Scope tracking (comma-separated list of granted scopes)
  granted_scopes text not null,

  -- Status
  is_active boolean default true,
  last_used_at timestamp with time zone,
  revoked_at timestamp with time zone,

  unique(client_id, meta_account_id)
);

create index if not exists idx_meta_oauth_client on meta_oauth_connections(client_id);
create index if not exists idx_meta_oauth_account on meta_oauth_connections(meta_account_id);

-- RLS: same permissive policy as google_oauth_connections for now (all API
-- access to this table goes through the service-role admin client anyway).
alter table meta_oauth_connections enable row level security;

create policy "Allow all access" on meta_oauth_connections
  for all using (true) with check (true);

-- Audit log, same shape as google_oauth_audit
create table if not exists meta_oauth_audit (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default now(),

  connection_id uuid not null references meta_oauth_connections(id) on delete cascade,
  event_type text not null, -- 'oauth_connected', 'oauth_revoked', 'api_call', 'token_error'
  details jsonb,

  error_message text
);

create index if not exists idx_meta_oauth_audit_connection on meta_oauth_audit(connection_id);
create index if not exists idx_meta_oauth_audit_type on meta_oauth_audit(event_type);

-- Mirrors scramble_users.google_connected
alter table scramble_users add column if not exists meta_connected boolean default false;
