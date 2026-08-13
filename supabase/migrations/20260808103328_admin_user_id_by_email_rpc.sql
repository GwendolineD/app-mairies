-- RPC to resolve email to user ID without the 50/2000-account ceiling of
-- auth.admin.listUsers(). Sujet 2 of the scaling roadmap.
--
-- SECURITY: This function accesses auth.users. It is restricted to
-- `service_role` only — do NOT grant to authenticated/anon.

create or replace function public.admin_user_id_by_email(p_email text)
returns uuid
language sql stable security definer set search_path = public, auth as $$
  -- p_email is lowercased by the caller-side comparison: GoTrue normalises
  -- addresses, and `u.email = ...` is backed by idx_users_email.
  select u.id from auth.users u where u.email = lower(trim(p_email)) limit 1;
$$;

revoke all on function public.admin_user_id_by_email(text) from public, anon, authenticated;
grant execute on function public.admin_user_id_by_email(text) to service_role;
