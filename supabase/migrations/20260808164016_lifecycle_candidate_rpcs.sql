-- Sujet 3: replace in-memory candidate selection with SQL joins
-- These functions select users eligible for lifecycle reminders.
-- They are security definer and restricted to service_role only,
-- because they reveal which users have not published content.

-- ─────────────────────────────────────────────────────────────────────────────
-- select_engagement_candidates: users created 3-30 days ago who have never
-- published (no announcements, initiatives, or events via any membership) and
-- have not yet received the engagement-first-week email.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.select_engagement_candidates(
  p_created_after timestamptz,
  p_created_before timestamptz,
  p_limit int
)
returns table (user_id uuid, display_name text, active_commune_id uuid)
language sql stable security definer set search_path = public as $$
  select p.user_id, p.display_name, p.active_commune_id
  from public.profiles p
  where p.engagement_reminder_sent_at is null
    and p.created_at > p_created_after
    and p.created_at < p_created_before
    -- User has never published content via any membership
    and not exists (
      select 1 from public.memberships m
      where m.user_id = p.user_id
        and (
          exists (select 1 from public.announcements a where a.author_membership_id = m.id)
          or exists (select 1 from public.initiatives i where i.author_membership_id = m.id)
          or exists (select 1 from public.events e where e.author_membership_id = m.id)
        )
    )
    -- Not already queued for this template (idempotency guard)
    and not exists (
      select 1 from public.email_queue q
      where q.recipient_user_id = p.user_id
        and q.template_slug = 'engagement-first-week'
    )
  order by p.created_at
  limit p_limit;
$$;

-- Restrict to service_role only
revoke all on function public.select_engagement_candidates(timestamptz, timestamptz, int) from public;
revoke all on function public.select_engagement_candidates(timestamptz, timestamptz, int) from anon;
revoke all on function public.select_engagement_candidates(timestamptz, timestamptz, int) from authenticated;
grant execute on function public.select_engagement_candidates(timestamptz, timestamptz, int) to service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- select_notification_activation_candidates: users created 1-7 days ago who
-- have no push subscription and have not yet received the notification
-- activation reminder email.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.select_notification_activation_candidates(
  p_created_after timestamptz,
  p_created_before timestamptz,
  p_limit int
)
returns table (user_id uuid, display_name text, active_commune_id uuid)
language sql stable security definer set search_path = public as $$
  select p.user_id, p.display_name, p.active_commune_id
  from public.profiles p
  where p.notification_prompt_email_sent_at is null
    and p.created_at > p_created_after
    and p.created_at < p_created_before
    -- User has no push subscription
    and not exists (
      select 1 from public.push_subscriptions ps
      where ps.user_id = p.user_id
    )
    -- Not already queued for this template (idempotency guard)
    and not exists (
      select 1 from public.email_queue q
      where q.recipient_user_id = p.user_id
        and q.template_slug = 'notification-activation-reminder'
    )
  order by p.created_at
  limit p_limit;
$$;

-- Restrict to service_role only
revoke all on function public.select_notification_activation_candidates(timestamptz, timestamptz, int) from public;
revoke all on function public.select_notification_activation_candidates(timestamptz, timestamptz, int) from anon;
revoke all on function public.select_notification_activation_candidates(timestamptz, timestamptz, int) from authenticated;
grant execute on function public.select_notification_activation_candidates(timestamptz, timestamptz, int) to service_role;
