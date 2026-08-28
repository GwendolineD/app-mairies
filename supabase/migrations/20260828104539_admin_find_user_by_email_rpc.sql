-- RPC to find a user ID by email address.
-- Restricted to service_role only (same pattern as admin_user_emails).
-- Replaces listUsers() calls that are capped at 50 accounts per page.

CREATE OR REPLACE FUNCTION public.admin_find_user_by_email(p_email text)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth AS $$
  SELECT u.id FROM auth.users u WHERE lower(u.email) = lower(p_email) LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.admin_find_user_by_email(text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_find_user_by_email(text) TO service_role;
