-- Worker inbox (2026-11-27)
-- Lets the team manage SEO worker suggestions across all clients: who owns
-- each one, an "in progress" step, a useful / not useful rating (so the worker
-- can learn what is good) and an internal note.
-- INTERNAL ONLY: nothing here is ever shown to clients.
-- NOT YET APPLIED: pending review.

alter table seo_suggestions drop constraint if exists seo_suggestions_status_check;
alter table seo_suggestions
  add constraint seo_suggestions_status_check
  check (status in ('new', 'accepted', 'in_progress', 'done', 'dismissed'));

alter table seo_suggestions add column if not exists owner text
  check (owner is null or owner in ('Herbie', 'Gabriel'));
alter table seo_suggestions add column if not exists rating text
  check (rating is null or rating in ('useful', 'not_useful'));
alter table seo_suggestions add column if not exists rating_by text;
alter table seo_suggestions add column if not exists note text;

create index if not exists idx_seo_suggestions_open on seo_suggestions(status, last_seen_at desc);
