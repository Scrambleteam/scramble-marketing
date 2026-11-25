-- Meta ad account per client (2026-11-26)
-- Clients share their ad account with Scramble's Meta business (Business
-- Settings -> Partners). An admin then assigns that account to the client
-- here, and the dashboard reads it with the company system user token.
-- NOT YET APPLIED: pending review.

alter table scramble_users add column if not exists meta_ad_account_id text;
