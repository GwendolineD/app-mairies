-- Sujet 4: select recipients for new-content fanout notifications
-- This function replaces the two-query pattern (memberships + preferences)
-- with a single SQL join, avoiding the 414 URI Too Long error when the
-- .in() filter exceeds ~217 UUIDs (~8 KB URL limit).
--
-- Security: the function reveals which users opted out of notifications,
-- so it is restricted to service_role only.

create or replace function public.select_content_notification_recipients(
  p_commune_id uuid,
  p_context_type text,
  p_author_user_id uuid,
  p_exclude_user_ids uuid[],
  p_after_user_id uuid,
  p_limit int
)
returns table (user_id uuid)
language sql stable security definer set search_path = public as $$
  select m.user_id
  from public.memberships m
  left join public.user_notification_preferences p on p.user_id = m.user_id
  where m.commune_id = p_commune_id
    and m.status = 'active'
    and m.user_id <> p_author_user_id
    -- Exclude specific users (e.g. initiative supporters who get a targeted notification)
    and (p_exclude_user_ids is null or not (m.user_id = any(p_exclude_user_ids)))
    -- Opt-in check: users without a preferences row default to opted-in (true)
    -- The preference column depends on the context type
    and coalesce(
      case p_context_type
        when 'announcement' then p.notify_new_announcement
        when 'initiative' then p.notify_new_initiative
        when 'event' then p.notify_new_event
        else true
      end,
      true
    ) = true
    -- Cursor pagination: start after p_after_user_id if provided
    and (p_after_user_id is null or m.user_id > p_after_user_id)
  order by m.user_id
  limit p_limit;
$$;

-- Restrict to service_role only
revoke all on function public.select_content_notification_recipients(uuid, text, uuid, uuid[], uuid, int) from public;
revoke all on function public.select_content_notification_recipients(uuid, text, uuid, uuid[], uuid, int) from anon;
revoke all on function public.select_content_notification_recipients(uuid, text, uuid, uuid[], uuid, int) from authenticated;
grant execute on function public.select_content_notification_recipients(uuid, text, uuid, uuid[], uuid, int) to service_role;
