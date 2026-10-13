-- Enquiries submitted through the public /contact form (2026-10-13)
-- Written by POST /api/contact using the service-role admin client.
-- NOT YET APPLIED: pending review.

create table if not exists enquiries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default now(),

  -- Contact details
  name text not null,
  email text not null,
  company text,
  website text,
  message text,

  -- When the visitor ticked "I agree to Scramble's Privacy Policy".
  -- Required by the form, so never null for rows written by the API.
  consent_at timestamp with time zone not null,

  -- Workflow status for the team: 'new' on arrival, then updated manually.
  status text not null default 'new',

  -- Where the enquiry came from, e.g. 'contact_page'
  source text
);

create index if not exists idx_enquiries_created_at on enquiries(created_at desc);
create index if not exists idx_enquiries_status on enquiries(status);

-- RLS: enabled with NO policies, so the anon and authenticated roles cannot
-- read or write this table through the public API. All access goes through
-- the service-role admin client (createAdminSupabaseClient), which bypasses
-- RLS. Deliberately NOT the "Allow all access" policy used on the OAuth
-- tables, because that would make enquiries readable with the public anon key.
alter table enquiries enable row level security;

revoke all on table enquiries from anon, authenticated;
