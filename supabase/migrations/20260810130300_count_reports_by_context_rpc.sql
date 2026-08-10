-- Sujet 7b-3: aggregate report counts by content context (backoffice signalements).

create or replace function public.count_reports_by_context(p_commune_id uuid default null)
returns table (
  context_type text,
  context_id uuid,
  report_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    r.context_type::text,
    r.context_id,
    count(*) as report_count
  from public.reports r
  where r.context_type <> 'user'
    and (p_commune_id is null or r.commune_id = p_commune_id)
  group by r.context_type, r.context_id;
$$;

revoke all on function public.count_reports_by_context(uuid) from public;
revoke all on function public.count_reports_by_context(uuid) from anon;
revoke all on function public.count_reports_by_context(uuid) from authenticated;
grant execute on function public.count_reports_by_context(uuid) to service_role;
