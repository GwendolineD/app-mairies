-- Subject 9 phase 1: wrap auth.uid() in (select auth.uid()) inside RLS helper functions
-- so Postgres can hoist the caller id into an InitPlan (Supabase RLS performance pattern).

CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = (select auth.uid())
      AND p.is_platform_admin = true
  );
$$;

CREATE OR REPLACE FUNCTION public.is_municipality_staff_for_commune(p_commune_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.memberships m
    WHERE m.user_id = (select auth.uid())
      AND m.commune_id = p_commune_id
      AND m.role IN ('staff', 'mayor')
      AND m.status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.has_active_membership(p_commune_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.memberships m
    WHERE m.user_id = (select auth.uid())
      AND m.commune_id = p_commune_id
      AND m.status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.owns_active_membership(p_membership_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.memberships m
    WHERE m.id = p_membership_id
      AND m.user_id = (select auth.uid())
      AND m.status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.share_active_commune_with(p_other_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.memberships m_self
    INNER JOIN public.memberships m_other
      ON m_self.commune_id = m_other.commune_id
    WHERE m_self.user_id = (select auth.uid())
      AND m_other.user_id = p_other_user_id
      AND m_self.status = 'active'
      AND m_other.status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_conversation_participant(p_conversation_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversation_participants cp
    WHERE cp.conversation_id = p_conversation_id
      AND cp.user_id = (select auth.uid())
  );
$$;

CREATE OR REPLACE FUNCTION public.can_add_conversation_participant(p_conversation_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversations c
    WHERE c.id = p_conversation_id
      AND (
        c.created_by_user_id = (select auth.uid())
        OR public.is_conversation_participant(p_conversation_id)
      )
  )
  OR public.is_platform_admin();
$$;
