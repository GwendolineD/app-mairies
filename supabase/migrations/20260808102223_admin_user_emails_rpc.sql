-- RPC to resolve user IDs to emails without the 50-account ceiling of
-- auth.admin.listUsers(). Sujet 2 of the scaling roadmap.
--
-- SECURITY: This function returns email addresses from auth.users. It is
-- restricted to `service_role` only — do NOT grant to authenticated/anon.

create or replace function public.admin_user_emails(p_user_ids uuid[])
returns table (user_id uuid, email text)
language sql stable security definer set search_path = public, auth as $$
  select u.id, u.email::text from auth.users u where u.id = any(p_user_ids);
$$;

revoke all on function public.admin_user_emails(uuid[]) from public, anon, authenticated;
grant execute on function public.admin_user_emails(uuid[]) to service_role;
