-- Team to-do list for the mobile app (2026-11-27)
-- Tasks for Herbie and Gabriel: added by hand or created from worker inbox
-- suggestions. INTERNAL ONLY: never shown to clients (service-role client only).
-- NOT YET APPLIED: pending review.

create table if not exists team_tasks (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),

  title text not null check (char_length(title) between 1 and 200),
  owner text check (owner is null or owner in ('Herbie', 'Gabriel')),
  due_date date,
  scramble_user_id uuid references scramble_users(id) on delete set null,

  source text not null default 'manual' check (source in ('manual', 'suggestion')),
  source_id uuid,

  done boolean not null default false,
  done_at timestamp with time zone,
  done_by text,
  created_by text
);

create index if not exists idx_team_tasks_open on team_tasks(done, due_date);
create index if not exists idx_team_tasks_owner on team_tasks(owner, done, due_date);

alter table team_tasks enable row level security;
revoke all on table team_tasks from anon, authenticated;
