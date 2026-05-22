-- Vie Locale MVP - initial schema
-- PostgreSQL / Supabase compatible

-- =============================================================================
-- Extensions
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- Enums
-- =============================================================================

CREATE TYPE public.user_role AS ENUM (
  'resident',
  'municipality_staff',
  'platform_admin'
);

CREATE TYPE public.subscription_status AS ENUM (
  'inactive',
  'trial',
  'active'
);

CREATE TYPE public.membership_status AS ENUM (
  'active',
  'suspended',
  'left'
);

CREATE TYPE public.announcement_type AS ENUM (
  'demande',
  'offre'
);

CREATE TYPE public.announcement_status AS ENUM (
  'ouverte',
  'pourvue',
  'archivee',
  'expiree'
);

CREATE TYPE public.content_status AS ENUM (
  'active',
  'archived'
);

CREATE TYPE public.initiative_date_mode AS ENUM (
  'none',
  'once',
  'recurring'
);

CREATE TYPE public.initiative_response_type AS ENUM (
  'support',
  'volunteer'
);

CREATE TYPE public.context_type AS ENUM (
  'announcement',
  'initiative',
  'event'
);

CREATE TYPE public.report_status AS ENUM (
  'pending',
  'reviewed',
  'dismissed'
);

CREATE TYPE public.appeal_status AS ENUM (
  'pending',
  'reviewed'
);

-- =============================================================================
-- Utility triggers (no table dependencies)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- RLS helpers and table-dependent functions are created after core tables below.

-- =============================================================================
-- Core tables
-- =============================================================================

CREATE TABLE public.communes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4 (),
  insee_code text NOT NULL UNIQUE,
  name text NOT NULL,
  postcode text,
  department text,
  centroid_lat double precision,
  centroid_lng double precision,
  subscription_status public.subscription_status NOT NULL DEFAULT 'inactive',
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now ()
);

CREATE TABLE public.announcement_categories (
  slug text PRIMARY KEY,
  label text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  icon_url text,
  map_pin_url text
);

CREATE TABLE public.profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  first_name text,
  last_name text,
  display_name text,
  avatar_url text,
  active_commune_id uuid REFERENCES public.communes (id) ON DELETE SET NULL,
  role public.user_role NOT NULL DEFAULT 'resident',
  created_at timestamptz NOT NULL DEFAULT now (),
  updated_at timestamptz NOT NULL DEFAULT now ()
);

CREATE TABLE public.memberships (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4 (),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  commune_id uuid NOT NULL REFERENCES public.communes (id) ON DELETE CASCADE,
  address_label text,
  address_citycode text,
  address_postcode text,
  address_lat double precision,
  address_lng double precision,
  is_primary boolean NOT NULL DEFAULT false,
  status public.membership_status NOT NULL DEFAULT 'active',
  suspended_at timestamptz,
  suspension_reason text,
  created_at timestamptz NOT NULL DEFAULT now (),
  updated_at timestamptz NOT NULL DEFAULT now (),
  UNIQUE (user_id, commune_id)
);

-- Validates author_membership belongs to commune_id (feed items)
CREATE OR REPLACE FUNCTION public.enforce_membership_commune_match()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  m_commune uuid;
BEGIN
  SELECT commune_id INTO m_commune FROM public.memberships WHERE id = NEW.author_membership_id;
  IF m_commune IS NULL THEN
    RAISE EXCEPTION 'Invalid author_membership_id';
  END IF;
  IF m_commune IS DISTINCT FROM NEW.commune_id THEN
    RAISE EXCEPTION 'author_membership must belong to commune_id';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4 (),
  commune_id uuid NOT NULL REFERENCES public.communes (id) ON DELETE CASCADE,
  author_membership_id uuid NOT NULL REFERENCES public.memberships (id) ON DELETE RESTRICT,
  type public.announcement_type NOT NULL,
  category_slug text NOT NULL REFERENCES public.announcement_categories (slug),
  title text NOT NULL,
  description text,
  photo_url text,
  target_date date,
  status public.announcement_status NOT NULL DEFAULT 'ouverte',
  stale_nudge_sent_at timestamptz,
  expiring_soon_sent_at timestamptz,
  expired_notified_at timestamptz,
  address_lat double precision,
  address_lng double precision,
  created_at timestamptz NOT NULL DEFAULT now (),
  updated_at timestamptz NOT NULL DEFAULT now ()
);

CREATE TRIGGER trg_announcements_membership_commune_match
BEFORE INSERT OR UPDATE OF commune_id, author_membership_id ON public.announcements
FOR EACH ROW
EXECUTE FUNCTION public.enforce_membership_commune_match ();

CREATE TABLE public.initiatives (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4 (),
  commune_id uuid NOT NULL REFERENCES public.communes (id) ON DELETE CASCADE,
  author_membership_id uuid NOT NULL REFERENCES public.memberships (id) ON DELETE RESTRICT,
  title text NOT NULL,
  description text,
  date_mode public.initiative_date_mode NOT NULL DEFAULT 'none',
  single_starts_at timestamptz,
  single_ends_at timestamptz,
  recurrence_rule jsonb,
  status public.content_status NOT NULL DEFAULT 'active',
  address_lat double precision,
  address_lng double precision,
  created_at timestamptz NOT NULL DEFAULT now (),
  updated_at timestamptz NOT NULL DEFAULT now ()
);

CREATE TRIGGER trg_initiatives_membership_commune_match
BEFORE INSERT OR UPDATE OF commune_id, author_membership_id ON public.initiatives
FOR EACH ROW
EXECUTE FUNCTION public.enforce_membership_commune_match ();

CREATE TABLE public.initiative_responses (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4 (),
  initiative_id uuid NOT NULL REFERENCES public.initiatives (id) ON DELETE CASCADE,
  membership_id uuid NOT NULL REFERENCES public.memberships (id) ON DELETE CASCADE,
  response_type public.initiative_response_type NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now (),
  UNIQUE (initiative_id, membership_id, response_type)
);

CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4 (),
  commune_id uuid NOT NULL REFERENCES public.communes (id) ON DELETE CASCADE,
  author_membership_id uuid NOT NULL REFERENCES public.memberships (id) ON DELETE RESTRICT,
  title text NOT NULL,
  description text,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  status public.content_status NOT NULL DEFAULT 'active',
  photo_url text,
  address_lat double precision,
  address_lng double precision,
  created_at timestamptz NOT NULL DEFAULT now (),
  updated_at timestamptz NOT NULL DEFAULT now (),
  CONSTRAINT events_range_valid CHECK (ends_at >= starts_at)
);

CREATE TRIGGER trg_events_membership_commune_match
BEFORE INSERT OR UPDATE OF commune_id, author_membership_id ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.enforce_membership_commune_match ();

CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4 (),
  commune_id uuid NOT NULL REFERENCES public.communes (id) ON DELETE CASCADE,
  created_by_user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  context_type public.context_type,
  context_id uuid,
  title text,
  created_at timestamptz NOT NULL DEFAULT now (),
  updated_at timestamptz NOT NULL DEFAULT now ()
);

CREATE TABLE public.conversation_participants (
  conversation_id uuid NOT NULL REFERENCES public.conversations (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now (),
  last_read_at timestamptz,
  PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4 (),
  conversation_id uuid NOT NULL REFERENCES public.conversations (id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now (),
  edited_at timestamptz
);

CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4 (),
  -- Omit commune_id on INSERT; trg_reports_set_commune derives it from reporter_membership_id.
  commune_id uuid NOT NULL REFERENCES public.communes (id) ON DELETE CASCADE,
  reporter_membership_id uuid NOT NULL REFERENCES public.memberships (id) ON DELETE CASCADE,
  context_type public.context_type NOT NULL,
  context_id uuid NOT NULL,
  reason text NOT NULL,
  status public.report_status NOT NULL DEFAULT 'pending',
  reviewed_at timestamptz,
  reviewed_by_user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now ()
);

CREATE OR REPLACE FUNCTION public.set_report_commune_from_reporter ()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  SELECT m.commune_id INTO NEW.commune_id
  FROM public.memberships m
  WHERE m.id = NEW.reporter_membership_id;

  IF NEW.commune_id IS NULL THEN
    RAISE EXCEPTION 'reporter_membership_id must exist';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_reports_set_commune
BEFORE INSERT ON public.reports
FOR EACH ROW
EXECUTE FUNCTION public.set_report_commune_from_reporter ();

CREATE TABLE public.moderation_appeals (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4 (),
  report_id uuid NOT NULL REFERENCES public.reports (id) ON DELETE CASCADE,
  appellant_user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  body text NOT NULL,
  status public.appeal_status NOT NULL DEFAULT 'pending',
  reviewed_at timestamptz,
  reviewer_user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now ()
);

CREATE TABLE public.commune_interest_leads (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4 (),
  email text NOT NULL,
  insee_code text,
  commune_id uuid REFERENCES public.communes (id) ON DELETE SET NULL,
  message text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now ()
);

CREATE TABLE public.neighbor_invites (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4 (),
  inviter_membership_id uuid NOT NULL REFERENCES public.memberships (id) ON DELETE CASCADE,
  commune_id uuid NOT NULL REFERENCES public.communes (id) ON DELETE CASCADE,
  email text NOT NULL,
  token text NOT NULL UNIQUE,
  expires_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now ()
);

CREATE TABLE public.analytics_events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4 (),
  commune_id uuid REFERENCES public.communes (id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  event_name text NOT NULL,
  properties jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now ()
);

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4 (),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  title text,
  body text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now ()
);

-- =============================================================================
-- RLS helpers (SECURITY DEFINER — require profiles / memberships tables)
-- =============================================================================

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
    WHERE p.user_id = auth.uid()
      AND p.role = 'platform_admin'
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
    WHERE m.user_id = auth.uid()
      AND m.commune_id = p_commune_id
      AND m.status = 'active'
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
    FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.role = 'municipality_staff'
      AND p.active_commune_id = p_commune_id
  );
$$;

CREATE OR REPLACE FUNCTION public.can_access_commune_content(p_commune_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_platform_admin()
    OR public.is_municipality_staff_for_commune(p_commune_id)
    OR public.has_active_membership(p_commune_id);
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
      AND m.user_id = auth.uid()
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
    WHERE m_self.user_id = auth.uid()
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
      AND cp.user_id = auth.uid()
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
        c.created_by_user_id = auth.uid()
        OR public.is_conversation_participant(p_conversation_id)
      )
  )
  OR public.is_platform_admin();
$$;

-- =============================================================================
-- Data integrity triggers (beyond FKs)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.enforce_neighbor_inviter_commune ()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.memberships m
    WHERE m.id = NEW.inviter_membership_id
      AND m.commune_id = NEW.commune_id
      AND m.status = 'active'
  ) THEN
    RAISE EXCEPTION 'inviter_membership must be active membership for commune';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_neighbor_invites_validate
BEFORE INSERT OR UPDATE ON public.neighbor_invites
FOR EACH ROW
EXECUTE FUNCTION public.enforce_neighbor_inviter_commune ();

CREATE OR REPLACE FUNCTION public.enforce_initiative_response_membership_commune ()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.memberships m
    INNER JOIN public.initiatives i
      ON i.commune_id = m.commune_id
    WHERE m.id = NEW.membership_id
      AND i.id = NEW.initiative_id
      AND m.status = 'active'
  ) THEN
    RAISE EXCEPTION 'membership must be active membership in initiative commune';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_initiative_responses_validate
BEFORE INSERT OR UPDATE ON public.initiative_responses
FOR EACH ROW
EXECUTE FUNCTION public.enforce_initiative_response_membership_commune ();

-- =============================================================================
-- Feed / sort indexes (commune scoped)
-- =============================================================================

CREATE INDEX idx_announcements_commune_created_at ON public.announcements (commune_id, created_at DESC);

CREATE INDEX idx_initiatives_commune_created_at ON public.initiatives (commune_id, created_at DESC);

CREATE INDEX idx_events_commune_created_at ON public.events (commune_id, created_at DESC);

CREATE INDEX idx_messages_conversation_created_at ON public.messages (conversation_id, created_at DESC);

CREATE INDEX idx_analytics_commune_created_at ON public.analytics_events (commune_id, created_at DESC);

CREATE INDEX idx_notifications_user_created_at ON public.notifications (user_id, created_at DESC);

-- =============================================================================
-- updated_at timestamps
-- =============================================================================

CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at ();

CREATE TRIGGER trg_memberships_updated_at BEFORE UPDATE ON public.memberships FOR EACH ROW EXECUTE FUNCTION public.set_updated_at ();

CREATE TRIGGER trg_announcements_updated_at BEFORE UPDATE ON public.announcements FOR EACH ROW EXECUTE FUNCTION public.set_updated_at ();

CREATE TRIGGER trg_initiatives_updated_at BEFORE UPDATE ON public.initiatives FOR EACH ROW EXECUTE FUNCTION public.set_updated_at ();

CREATE TRIGGER trg_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.set_updated_at ();

CREATE TRIGGER trg_conversations_updated_at BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at ();

-- =============================================================================
-- Seed announcement categories (inline)
-- =============================================================================

INSERT INTO public.announcement_categories (slug, label, sort_order, icon_url, map_pin_url)
VALUES
  ('bricolage', 'Bricolage', 1, null, null),
  ('numerique', 'Numérique', 2, null, null),
  ('covoiturage', 'Covoiturage', 3, null, null),
  ('alimentaire', 'Alimentaire', 4, null, null),
  ('garde-pontuelle', 'Garde pontuelle', 5, null, null),
  ('administratif', 'Administratif', 6, null, null),
  ('animaux', 'Animaux', 7, null, null),
  ('jardinage', 'Jardinage', 8, null, null),
  ('pret-objet', 'Prêt d''objet', 9, null, null),
  ('don-troc', 'Don / troc', 10, null, null),
  ('autres', 'Autres', 11, null, null)
ON CONFLICT (slug) DO UPDATE SET
  label = excluded.label,
  sort_order = excluded.sort_order,
  icon_url = excluded.icon_url,
  map_pin_url = excluded.map_pin_url;

-- =============================================================================
-- Signup hook: mirror auth.users → public.profiles
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user ()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    user_id,
    first_name,
    last_name,
    display_name
  )
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    COALESCE(
      NEW.raw_user_meta_data ->> 'display_name',
      NULLIF(trim(both from split_part(coalesce(NEW.email, ''::text), '@', 1)), ''::text)
    )
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user ();

-- =============================================================================
-- Row Level Security - enable everywhere
-- =============================================================================

ALTER TABLE public.communes ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.announcement_categories ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.initiatives ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.initiative_responses ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.moderation_appeals ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.commune_interest_leads ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.neighbor_invites ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- Policies
-- -----------------------------------------------------------------------------

-- Anonymous browsing of communes / categories (discovery); writes restricted.

CREATE POLICY communes_select_public ON public.communes FOR SELECT
USING (auth.role () IN ('anon', 'authenticated'));

CREATE POLICY communes_insert_admin ON public.communes FOR INSERT
WITH CHECK (public.is_platform_admin ());

CREATE POLICY communes_update_admin_staff ON public.communes FOR UPDATE
USING (
  public.is_platform_admin ()
  OR public.is_municipality_staff_for_commune (id)
)
WITH CHECK (
  public.is_platform_admin ()
  OR public.is_municipality_staff_for_commune (id)
);

CREATE POLICY communes_delete_admin ON public.communes FOR DELETE
USING (public.is_platform_admin ());

CREATE POLICY announcement_categories_select_public ON public.announcement_categories FOR SELECT
USING (auth.role () IN ('anon', 'authenticated'));

CREATE POLICY announcement_categories_write_admin ON public.announcement_categories FOR ALL
USING (public.is_platform_admin ())
WITH CHECK (public.is_platform_admin ());

CREATE POLICY profiles_select ON public.profiles FOR SELECT
USING (
  user_id = auth.uid ()
  OR public.is_platform_admin ()
  OR public.share_active_commune_with (user_id)
);

CREATE POLICY profiles_update ON public.profiles FOR UPDATE
USING (public.is_platform_admin () OR user_id = auth.uid ())
WITH CHECK (public.is_platform_admin () OR user_id = auth.uid ());

CREATE POLICY memberships_select ON public.memberships FOR SELECT
USING (
  public.is_platform_admin ()
  OR public.is_municipality_staff_for_commune (commune_id)
  OR public.share_active_commune_with (user_id)
  OR auth.uid () = user_id
);

CREATE POLICY memberships_insert ON public.memberships FOR INSERT
WITH CHECK (auth.uid () = user_id);

CREATE POLICY memberships_update ON public.memberships FOR UPDATE
USING (
  public.is_platform_admin ()
  OR public.is_municipality_staff_for_commune (commune_id)
  OR auth.uid () = user_id
);

CREATE POLICY memberships_delete ON public.memberships FOR DELETE
USING (public.is_platform_admin () OR auth.uid () = user_id);

CREATE POLICY announcements_select ON public.announcements FOR SELECT
USING (public.can_access_commune_content (commune_id));

CREATE POLICY announcements_insert ON public.announcements FOR INSERT
WITH CHECK (
  public.can_access_commune_content (commune_id)
  AND (
    public.is_platform_admin ()
    OR public.is_municipality_staff_for_commune (commune_id)
    OR public.owns_active_membership (author_membership_id)
  )
);

CREATE POLICY announcements_update ON public.announcements FOR UPDATE
USING (
  public.can_access_commune_content (commune_id)
  AND (
    public.is_platform_admin ()
    OR public.is_municipality_staff_for_commune (commune_id)
    OR public.owns_active_membership (author_membership_id)
  )
);

CREATE POLICY announcements_delete ON public.announcements FOR DELETE
USING (
  public.can_access_commune_content (commune_id)
  AND (
    public.is_platform_admin ()
    OR public.is_municipality_staff_for_commune (commune_id)
    OR public.owns_active_membership (author_membership_id)
  )
);

CREATE POLICY initiatives_select ON public.initiatives FOR SELECT
USING (public.can_access_commune_content (commune_id));

CREATE POLICY initiatives_insert ON public.initiatives FOR INSERT
WITH CHECK (
  public.can_access_commune_content (commune_id)
  AND (
    public.is_platform_admin ()
    OR public.is_municipality_staff_for_commune (commune_id)
    OR public.owns_active_membership (author_membership_id)
  )
);

CREATE POLICY initiatives_update ON public.initiatives FOR UPDATE
USING (
  public.can_access_commune_content (commune_id)
  AND (
    public.is_platform_admin ()
    OR public.is_municipality_staff_for_commune (commune_id)
    OR public.owns_active_membership (author_membership_id)
  )
);

CREATE POLICY initiatives_delete ON public.initiatives FOR DELETE
USING (
  public.can_access_commune_content (commune_id)
  AND (
    public.is_platform_admin ()
    OR public.is_municipality_staff_for_commune (commune_id)
    OR public.owns_active_membership (author_membership_id)
  )
);

CREATE POLICY initiative_responses_select ON public.initiative_responses FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.initiatives i
    WHERE i.id = initiative_responses.initiative_id
      AND public.can_access_commune_content (i.commune_id)
  )
);

CREATE POLICY initiative_responses_insert ON public.initiative_responses FOR INSERT
WITH CHECK (
  public.owns_active_membership (membership_id)
  AND EXISTS (
    SELECT 1
    FROM public.initiatives i
    WHERE i.id = initiative_responses.initiative_id
      AND public.can_access_commune_content (i.commune_id)
  )
);

CREATE POLICY initiative_responses_update ON public.initiative_responses FOR UPDATE
USING (
  public.is_platform_admin ()
  OR public.is_municipality_staff_for_commune (
      (SELECT i.commune_id FROM public.initiatives i WHERE i.id = initiative_responses.initiative_id)
    )
  OR public.owns_active_membership (membership_id)
);

CREATE POLICY initiative_responses_delete ON public.initiative_responses FOR DELETE
USING (
  public.is_platform_admin ()
  OR public.is_municipality_staff_for_commune (
      (SELECT i.commune_id FROM public.initiatives i WHERE i.id = initiative_responses.initiative_id)
    )
  OR public.owns_active_membership (membership_id)
);

CREATE POLICY events_select ON public.events FOR SELECT
USING (public.can_access_commune_content (commune_id));

CREATE POLICY events_insert ON public.events FOR INSERT
WITH CHECK (
  public.can_access_commune_content (commune_id)
  AND (
    public.is_platform_admin ()
    OR public.is_municipality_staff_for_commune (commune_id)
    OR public.owns_active_membership (author_membership_id)
  )
);

CREATE POLICY events_update ON public.events FOR UPDATE
USING (
  public.can_access_commune_content (commune_id)
  AND (
    public.is_platform_admin ()
    OR public.is_municipality_staff_for_commune (commune_id)
    OR public.owns_active_membership (author_membership_id)
  )
);

CREATE POLICY events_delete ON public.events FOR DELETE
USING (
  public.can_access_commune_content (commune_id)
  AND (
    public.is_platform_admin ()
    OR public.is_municipality_staff_for_commune (commune_id)
    OR public.owns_active_membership (author_membership_id)
  )
);

CREATE POLICY conversations_select ON public.conversations FOR SELECT
USING (
  public.is_platform_admin ()
  OR public.is_conversation_participant (id)
);

CREATE POLICY conversations_insert ON public.conversations FOR INSERT
WITH CHECK (
  auth.uid () = created_by_user_id
  AND public.can_access_commune_content (commune_id)
);

CREATE POLICY conversations_update ON public.conversations FOR UPDATE
USING (
  public.is_platform_admin ()
  OR public.can_add_conversation_participant (id)
);

CREATE POLICY conversation_participants_select ON public.conversation_participants FOR SELECT
USING (
  public.is_platform_admin ()
  OR public.is_conversation_participant (conversation_id)
);

CREATE POLICY conversation_participants_insert ON public.conversation_participants FOR INSERT
WITH CHECK (public.can_add_conversation_participant (conversation_id));

CREATE POLICY conversation_participants_delete ON public.conversation_participants FOR DELETE
USING (
  public.is_platform_admin ()
  OR user_id = auth.uid ()
  OR EXISTS (
    SELECT 1
    FROM public.conversations c
    WHERE c.id = conversation_id
      AND c.created_by_user_id = auth.uid ()
  )
);

CREATE POLICY messages_select ON public.messages FOR SELECT
USING (
  public.is_platform_admin ()
  OR public.is_conversation_participant (conversation_id)
);

CREATE POLICY messages_insert ON public.messages FOR INSERT
WITH CHECK (
  sender_id = auth.uid ()
  AND public.is_conversation_participant (conversation_id)
);

CREATE POLICY messages_update ON public.messages FOR UPDATE
USING (
  sender_id = auth.uid ()
  AND public.is_conversation_participant (conversation_id)
);

CREATE POLICY messages_delete ON public.messages FOR DELETE
USING (
  sender_id = auth.uid ()
  AND public.is_conversation_participant (conversation_id)
);

CREATE POLICY reports_select ON public.reports FOR SELECT
USING (
  public.is_platform_admin ()
  OR public.is_municipality_staff_for_commune (commune_id)
  OR EXISTS (
    SELECT 1
    FROM public.memberships m
    WHERE m.id = reporter_membership_id
      AND m.user_id = auth.uid ()
  )
);

CREATE POLICY reports_insert ON public.reports FOR INSERT
WITH CHECK (public.owns_active_membership (reporter_membership_id));

CREATE POLICY reports_update_staff ON public.reports FOR UPDATE
USING (
  public.is_platform_admin ()
  OR public.is_municipality_staff_for_commune (commune_id)
);

CREATE POLICY moderation_appeals_select ON public.moderation_appeals FOR SELECT
USING (
  public.is_platform_admin ()
  OR appellant_user_id = auth.uid ()
  OR public.is_municipality_staff_for_commune (
      (
        SELECT r.commune_id
        FROM public.reports r
        WHERE r.id = moderation_appeals.report_id
      )
    )
);

CREATE POLICY moderation_appeals_insert ON public.moderation_appeals FOR INSERT
WITH CHECK (appellant_user_id = auth.uid ());

CREATE POLICY moderation_appeals_update_staff ON public.moderation_appeals FOR UPDATE
USING (
  public.is_platform_admin ()
  OR public.is_municipality_staff_for_commune (
      (
        SELECT r.commune_id
        FROM public.reports r
        WHERE r.id = moderation_appeals.report_id
      )
    )
);

CREATE POLICY commune_interest_leads_insert ON public.commune_interest_leads FOR INSERT
WITH CHECK (auth.role () IN ('anon', 'authenticated'));

CREATE POLICY commune_interest_leads_select_staff ON public.commune_interest_leads FOR SELECT
USING (
  public.is_platform_admin ()
  OR (
    commune_id IS NOT NULL
    AND public.is_municipality_staff_for_commune (commune_id)
  )
);

CREATE POLICY neighbor_invites_select ON public.neighbor_invites FOR SELECT
USING (
  public.is_platform_admin ()
  OR public.is_municipality_staff_for_commune (commune_id)
  OR EXISTS (
    SELECT 1
    FROM public.memberships m
    WHERE m.id = inviter_membership_id
      AND m.user_id = auth.uid ()
  )
);

CREATE POLICY neighbor_invites_insert ON public.neighbor_invites FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.memberships m
    WHERE m.id = inviter_membership_id
      AND m.user_id = auth.uid ()
      AND m.status = 'active'
      AND m.commune_id = neighbor_invites.commune_id
  )
);

CREATE POLICY neighbor_invites_update ON public.neighbor_invites FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.memberships m
    WHERE m.id = inviter_membership_id
      AND m.user_id = auth.uid ()
  )
  OR public.is_municipality_staff_for_commune (commune_id)
  OR public.is_platform_admin ()
);

CREATE POLICY neighbor_invites_delete ON public.neighbor_invites FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.memberships m
    WHERE m.id = inviter_membership_id
      AND m.user_id = auth.uid ()
  )
  OR public.is_platform_admin ()
);

CREATE POLICY analytics_events_insert ON public.analytics_events FOR INSERT
WITH CHECK (
  auth.role () = 'authenticated'
  AND (user_id IS NULL OR user_id = auth.uid ())
  AND (
    commune_id IS NULL
    OR public.has_active_membership (commune_id)
  )
);

CREATE POLICY analytics_events_select_staff ON public.analytics_events FOR SELECT
USING (
  public.is_platform_admin ()
  OR (
    commune_id IS NOT NULL
    AND public.is_municipality_staff_for_commune (commune_id)
  )
);

CREATE POLICY notifications_select ON public.notifications FOR SELECT
USING (public.is_platform_admin () OR user_id = auth.uid ());

CREATE POLICY notifications_update ON public.notifications FOR UPDATE
USING (public.is_platform_admin () OR user_id = auth.uid ());

CREATE POLICY notifications_delete ON public.notifications FOR DELETE
USING (public.is_platform_admin () OR user_id = auth.uid ());

-- Notifications are inserted by service_role / Edge Functions (bypasses RLS). No INSERT policy for clients.

-- =============================================================================
-- Grants (baseline Supabase-compatible)
-- =============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

GRANT SELECT ON public.communes TO anon;

GRANT SELECT ON public.announcement_categories TO anon;

GRANT INSERT ON public.commune_interest_leads TO anon;

