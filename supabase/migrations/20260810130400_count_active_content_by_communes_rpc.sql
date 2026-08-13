-- Sujet 7b-4: active content counts per commune (backoffice communes list).

create or replace function public.count_active_content_by_communes(p_commune_ids uuid[])
returns table (
  commune_id uuid,
  members bigint,
  announcements bigint,
  initiatives bigint,
  events bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.id as commune_id,
    coalesce(m.cnt, 0) as members,
    coalesce(a.cnt, 0) as announcements,
    coalesce(i.cnt, 0) as initiatives,
    coalesce(ev.cnt, 0) as events
  from unnest(p_commune_ids) as c(id)
  left join (
    select commune_id, count(*) as cnt
    from public.memberships
    where commune_id = any (p_commune_ids)
      and status = 'active'
    group by commune_id
  ) m on m.commune_id = c.id
  left join (
    select commune_id, count(*) as cnt
    from public.announcements
    where commune_id = any (p_commune_ids)
      and status = 'ouverte'
    group by commune_id
  ) a on a.commune_id = c.id
  left join (
    select commune_id, count(*) as cnt
    from public.initiatives
    where commune_id = any (p_commune_ids)
      and status = 'active'
    group by commune_id
  ) i on i.commune_id = c.id
  left join (
    select commune_id, count(*) as cnt
    from public.events
    where commune_id = any (p_commune_ids)
      and status = 'active'
    group by commune_id
  ) ev on ev.commune_id = c.id;
$$;

revoke all on function public.count_active_content_by_communes(uuid[]) from public;
revoke all on function public.count_active_content_by_communes(uuid[]) from anon;
revoke all on function public.count_active_content_by_communes(uuid[]) from authenticated;
grant execute on function public.count_active_content_by_communes(uuid[]) to service_role;
