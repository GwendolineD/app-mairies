-- Sujet 7b-1: aggregate event volunteer/participant counts (avoids max_rows + 414 on .in()).

create or replace function public.count_event_participation(p_event_ids uuid[])
returns table (
  event_id uuid,
  volunteers_count bigint,
  participants_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    e.id as event_id,
    coalesce(v.cnt, 0) as volunteers_count,
    coalesce(p.cnt, 0) as participants_count
  from unnest(p_event_ids) as e(id)
  left join (
    select ev.event_id, count(*) as cnt
    from public.event_volunteers ev
    where ev.event_id = any (p_event_ids)
    group by ev.event_id
  ) v on v.event_id = e.id
  left join (
    select ep.event_id, count(*) as cnt
    from public.event_participants ep
    where ep.event_id = any (p_event_ids)
    group by ep.event_id
  ) p on p.event_id = e.id;
$$;

grant execute on function public.count_event_participation(uuid[]) to authenticated;
grant execute on function public.count_event_participation(uuid[]) to service_role;
