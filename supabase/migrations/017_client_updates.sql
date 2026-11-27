-- Client-facing updates (2026-11-28)
-- Everything a client reads on the Overview tab of their dashboard: wins, work
-- done, and what's next. Each item is a DRAFT until a Scramble team member
-- approves and publishes it. Clients only ever see published rows, through an
-- API that returns just kind, body and date (never evidence or drafts).
-- Wins can be drafted automatically from the client's data, for the team to
-- edit and approve; 'evidence' holds the numbers behind a draft (internal).
-- Service-role only.
-- NOT YET APPLIED: pending review.

create table if not exists client_updates (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  scramble_user_id uuid not null references scramble_users(id) on delete cascade,

  kind text not null check (kind in ('win', 'done', 'next')),
  body text not null check (char_length(body) between 1 and 400),
  status text not null default 'draft' check (status in ('draft', 'published')),

  auto_drafted boolean not null default false,
  dedupe_key text,
  evidence jsonb not null default '{}'::jsonb,

  created_by text,
  published_by text,
  published_at timestamp with time zone,

  unique (scramble_user_id, dedupe_key)
);

create index if not exists idx_client_updates_client on client_updates(scramble_user_id, status, published_at desc);

alter table client_updates enable row level security;
revoke all on table client_updates from anon, authenticated;
