-- Add recipient_user_id to email_queue for opt-out checking without querying GoTrue.
-- ON DELETE CASCADE ensures pending emails are removed when the user account is deleted.
-- NULL means the recipient has no account (invitations) — opt-out cannot apply.

alter table public.email_queue
  add column if not exists recipient_user_id uuid references auth.users (id) on delete cascade;

create index if not exists idx_email_queue_recipient_user
  on public.email_queue (recipient_user_id);

-- Backfill any pending rows that already exist at deploy time.
-- Without this, they would be treated as account-less recipients and bypass opt-out.
-- GoTrue normalizes emails to lowercase, so we compare directly with lower().
update public.email_queue q
set recipient_user_id = u.id
from auth.users u
where u.email = lower(q.to_email)
  and q.status = 'pending'
  and q.recipient_user_id is null;
