-- Client workspace: brief, strategy and activity per client (2026-10-29)
-- Written and read only by the admin client workspace (/admin/clients/[id])
-- through the service-role client. Replaces the brief/strategy/notes that
-- lived in data/clients.json (which Vercel doesn't persist).
-- NOT YET APPLIED: pending review.

-- One row per client: the business brief and campaign strategy as JSON
-- (field lists are defined in lib/workspace.ts).
create table if not exists client_workspace (
  scramble_user_id uuid primary key references scramble_users(id) on delete cascade,
  brief jsonb not null default '{}'::jsonb,
  brief_updated_at timestamp with time zone,
  brief_updated_by text,
  strategy jsonb not null default '{}'::jsonb,
  strategy_updated_at timestamp with time zone,
  strategy_updated_by text
);

-- Activity timeline: notes and actions written by the team, plus automatic
-- entries (type 'system') such as Google property changes.
create table if not exists client_notes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone not null default now(),
  scramble_user_id uuid not null references scramble_users(id) on delete cascade,
  type text not null default 'note' check (type in ('note', 'action', 'alert', 'system')),
  content text not null check (char_length(content) between 1 and 5000),
  author text not null
);

create index if not exists idx_client_notes_client_created on client_notes(scramble_user_id, created_at desc);

-- Service-role only, like enquiries and agency_google_connection.
alter table client_workspace enable row level security;
alter table client_notes enable row level security;
revoke all on table client_workspace from anon, authenticated;
revoke all on table client_notes from anon, authenticated;
