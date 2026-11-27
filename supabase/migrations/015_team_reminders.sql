-- Scheduled phone reminders for the team app (2026-11-28)
-- reminder_log: one row per reminder sent per day, so a reminder never goes
--   out twice even if the check runs many times. INTERNAL; service role only.
-- pg_cron: every 5 minutes, Supabase calls the site, which decides (in London
--   time) whether a reminder is due: Sunday 10:00 and 18:00, weekdays 08:00.
-- NOT YET APPLIED: pending review.

create table if not exists reminder_log (
  slot text not null,
  run_date date not null,
  sent_at timestamp with time zone not null default now(),
  recipients integer,
  primary key (slot, run_date)
);

alter table reminder_log enable row level security;
revoke all on table reminder_log from anon, authenticated;

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'team-reminders',
  '*/5 * * * *',
  $$ select net.http_post(
       url := 'https://www.scramblemarketing.co.uk/api/cron/team-reminders',
       headers := '{"Content-Type": "application/json"}'::jsonb,
       body := '{}'::jsonb
     ); $$
);
