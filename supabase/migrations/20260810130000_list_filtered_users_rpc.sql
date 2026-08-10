-- Sujet 7a: paginated backoffice user list with membership filters on one row.
-- Replaces unbounded membership/profile reads + JS intersection (max_rows bug).

create or replace function public.list_filtered_users_page(
  p_q text default null,
  p_banned boolean default null,
  p_admin boolean default null,
  p_date_from timestamptz default null,
  p_date_to timestamptz default null,
  p_commune_id uuid default null,
  p_role text default null,
  p_membership_status text default null,
  p_limit int default 20,
  p_offset int default 0
)
returns table (
  user_id uuid,
  first_name text,
  last_name text,
  display_name text,
  created_at timestamptz,
  is_platform_admin boolean,
  banned_at timestamptz,
  total_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.user_id,
    p.first_name,
    p.last_name,
    p.display_name,
    p.created_at,
    p.is_platform_admin,
    p.banned_at,
    count(*) over () as total_count
  from public.profiles p
  where
    (
      p_q is null
      or btrim(p_q) = ''
      or p.first_name ilike '%' || p_q || '%'
      or p.last_name ilike '%' || p_q || '%'
      or p.display_name ilike '%' || p_q || '%'
    )
    and (
      p_banned is null
      or (p_banned = true and p.banned_at is not null)
      or (p_banned = false and p.banned_at is null)
    )
    and (
      p_admin is null
      or p.is_platform_admin = p_admin
    )
    and (p_date_from is null or p.created_at >= p_date_from)
    and (p_date_to is null or p.created_at <= p_date_to)
    and (
      (
        p_commune_id is null
        and p_role is null
        and p_membership_status is null
      )
      or exists (
        select 1
        from public.memberships m
        where m.user_id = p.user_id
          and (p_commune_id is null or m.commune_id = p_commune_id)
          and (p_role is null or m.role = p_role::public.membership_role)
          and (
            case
              when p_membership_status is not null then
                m.status = p_membership_status::public.membership_status
              when p_commune_id is not null or p_role is not null then
                m.status <> 'left'
              else true
            end
          )
      )
    )
  order by p.created_at desc
  limit p_limit
  offset p_offset;
$$;

revoke all on function public.list_filtered_users_page(
  text, boolean, boolean, timestamptz, timestamptz, uuid, text, text, int, int
) from public;
revoke all on function public.list_filtered_users_page(
  text, boolean, boolean, timestamptz, timestamptz, uuid, text, text, int, int
) from anon;
revoke all on function public.list_filtered_users_page(
  text, boolean, boolean, timestamptz, timestamptz, uuid, text, text, int, int
) from authenticated;
grant execute on function public.list_filtered_users_page(
  text, boolean, boolean, timestamptz, timestamptz, uuid, text, text, int, int
) to service_role;
