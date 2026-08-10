-- Sujet 7c: per-commune population and content stats for backoffice dashboards.

create or replace function public.count_population_by_commune()
returns table (
  commune_id uuid,
  population int,
  active_members bigint,
  pending_invites bigint,
  total_invites bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.id as commune_id,
    c.population,
    coalesce(m.cnt, 0) as active_members,
    coalesce(pi.cnt, 0) as pending_invites,
    coalesce(ti.cnt, 0) as total_invites
  from public.communes c
  left join (
    select commune_id, count(*) as cnt
    from public.memberships
    where status = 'active'
    group by commune_id
  ) m on m.commune_id = c.id
  left join (
    select commune_id, count(*) as cnt
    from public.neighbor_invites
    where accepted_at is null
      and (expires_at is null or expires_at >= now())
    group by commune_id
  ) pi on pi.commune_id = c.id
  left join (
    select commune_id, count(*) as cnt
    from public.neighbor_invites
    group by commune_id
  ) ti on ti.commune_id = c.id
  where c.access_status in ('trial', 'active');
$$;

create or replace function public.count_content_by_commune()
returns table (
  commune_id uuid,
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
    coalesce(a.cnt, 0) as announcements,
    coalesce(i.cnt, 0) as initiatives,
    coalesce(ev.cnt, 0) as events
  from public.communes c
  left join (
    select commune_id, count(*) as cnt
    from public.announcements
    group by commune_id
  ) a on a.commune_id = c.id
  left join (
    select commune_id, count(*) as cnt
    from public.initiatives
    group by commune_id
  ) i on i.commune_id = c.id
  left join (
    select commune_id, count(*) as cnt
    from public.events
    group by commune_id
  ) ev on ev.commune_id = c.id
  where c.access_status in ('trial', 'active');
$$;

revoke all on function public.count_population_by_commune() from public;
revoke all on function public.count_population_by_commune() from anon;
revoke all on function public.count_population_by_commune() from authenticated;
grant execute on function public.count_population_by_commune() to service_role;

revoke all on function public.count_content_by_commune() from public;
revoke all on function public.count_content_by_commune() from anon;
revoke all on function public.count_content_by_commune() from authenticated;
grant execute on function public.count_content_by_commune() to service_role;
