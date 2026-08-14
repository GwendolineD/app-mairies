-- Sujet 7b-2: aggregate initiative support counts (avoids max_rows + 414 on .in()).

create or replace function public.count_initiative_support(p_initiative_ids uuid[])
returns table (
  initiative_id uuid,
  support_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    i.id as initiative_id,
    coalesce(s.cnt, 0) as support_count
  from unnest(p_initiative_ids) as i(id)
  left join (
    select r.initiative_id, count(*) as cnt
    from public.initiative_responses r
    where r.initiative_id = any (p_initiative_ids)
      and r.response_type = 'support'
    group by r.initiative_id
  ) s on s.initiative_id = i.id;
$$;

grant execute on function public.count_initiative_support(uuid[]) to authenticated;
grant execute on function public.count_initiative_support(uuid[]) to service_role;
