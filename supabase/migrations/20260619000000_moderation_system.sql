-- Moderation system: content suspension, platform ban, moderation journal, platform settings
-- Adds moderation columns to content tables, creates moderation_actions journal,
-- platform_settings, banned_emails, report_resolution enum, and updates RPC.

BEGIN;

-- =============================================================================
-- Enums
-- =============================================================================

CREATE TYPE public.moderation_target_type AS ENUM (
  'announcement',
  'initiative',
  'event',
  'membership',
  'user'
);

CREATE TYPE public.moderation_action_type AS ENUM (
  'suspend',
  'reactivate',
  'ban',
  'unban'
);

CREATE TYPE public.report_resolution AS ENUM (
  'content_suspended',
  'user_suspended',
  'dismissed'
);

-- =============================================================================
-- Content moderation columns
-- =============================================================================

ALTER TABLE public.announcements
  ADD COLUMN suspended_at timestamptz,
  ADD COLUMN suspended_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN suspension_reason text;

ALTER TABLE public.initiatives
  ADD COLUMN suspended_at timestamptz,
  ADD COLUMN suspended_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN suspension_reason text;

ALTER TABLE public.events
  ADD COLUMN suspended_at timestamptz,
  ADD COLUMN suspended_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN suspension_reason text;

-- Partial indexes for fast filtering of non-suspended content
CREATE INDEX idx_announcements_not_suspended ON public.announcements (commune_id, status)
  WHERE suspended_at IS NULL;

CREATE INDEX idx_initiatives_not_suspended ON public.initiatives (commune_id, status)
  WHERE suspended_at IS NULL;

CREATE INDEX idx_events_not_suspended ON public.events (commune_id, status)
  WHERE suspended_at IS NULL;

-- =============================================================================
-- Report resolution column
-- =============================================================================

ALTER TABLE public.reports
  ADD COLUMN resolution public.report_resolution;

-- =============================================================================
-- Moderation actions journal
-- =============================================================================

CREATE TABLE public.moderation_actions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  target_type public.moderation_target_type NOT NULL,
  target_id uuid NOT NULL,
  commune_id uuid REFERENCES public.communes(id) ON DELETE SET NULL,
  action public.moderation_action_type NOT NULL,
  reason text,
  related_report_id uuid REFERENCES public.reports(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_moderation_actions_target ON public.moderation_actions (target_type, target_id);
CREATE INDEX idx_moderation_actions_commune ON public.moderation_actions (commune_id, created_at DESC);

ALTER TABLE public.moderation_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY moderation_actions_select ON public.moderation_actions FOR SELECT
USING (
  public.is_platform_admin()
  OR public.is_municipality_staff_for_commune(commune_id)
);

CREATE POLICY moderation_actions_insert ON public.moderation_actions FOR INSERT
WITH CHECK (
  public.is_platform_admin()
  OR public.is_municipality_staff_for_commune(commune_id)
);

-- =============================================================================
-- Platform settings (singleton-style, keyed by id=1)
-- =============================================================================

CREATE TABLE public.platform_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  support_email text NOT NULL DEFAULT 'contact@vielocale.fr',
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.platform_settings (id, support_email) VALUES (1, 'contact@vielocale.fr');

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY platform_settings_select ON public.platform_settings FOR SELECT
USING (true);

CREATE POLICY platform_settings_update ON public.platform_settings FOR UPDATE
USING (public.is_platform_admin());

-- =============================================================================
-- Banned emails (survives account deletion)
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE public.banned_emails (
  email citext PRIMARY KEY,
  reason text,
  banned_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  banned_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.banned_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY banned_emails_select ON public.banned_emails FOR SELECT
USING (public.is_platform_admin());

CREATE POLICY banned_emails_insert ON public.banned_emails FOR INSERT
WITH CHECK (public.is_platform_admin());

CREATE POLICY banned_emails_delete ON public.banned_emails FOR DELETE
USING (public.is_platform_admin());

-- =============================================================================
-- Profile ban columns
-- =============================================================================

ALTER TABLE public.profiles
  ADD COLUMN banned_at timestamptz,
  ADD COLUMN ban_reason text,
  ADD COLUMN banned_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- =============================================================================
-- Update list_my_conversations RPC to include context_available
-- =============================================================================

DROP FUNCTION IF EXISTS public.list_my_conversations(uuid, boolean);

CREATE FUNCTION public.list_my_conversations(
  p_commune_id uuid,
  p_archived boolean DEFAULT false
)
RETURNS TABLE (
  conversation_id uuid,
  context_type public.context_type,
  context_id uuid,
  title text,
  context_photo_url text,
  context_available boolean,
  updated_at timestamptz,
  last_message_at timestamptz,
  last_message_preview text,
  last_message_sender_id uuid,
  archived_at timestamptz,
  last_read_at timestamptz,
  other_user_id uuid,
  other_display_name text,
  other_avatar_url text,
  unread_count integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH my AS (
    SELECT cp.conversation_id, cp.archived_at, cp.last_read_at
    FROM public.conversation_participants cp
    WHERE cp.user_id = auth.uid()
      AND (
        (p_archived = false AND cp.archived_at IS NULL)
        OR (p_archived = true AND cp.archived_at IS NOT NULL AND cp.archived_at > now() - interval '30 days')
      )
  )
  SELECT
    c.id AS conversation_id,
    c.context_type,
    c.context_id,
    c.title,
    COALESCE(
      CASE WHEN c.context_type = 'announcement' THEN (SELECT a.photo_url FROM announcements a WHERE a.id = c.context_id) END,
      CASE WHEN c.context_type = 'initiative' THEN (SELECT i.photo_url FROM initiatives i WHERE i.id = c.context_id) END,
      CASE WHEN c.context_type = 'event' THEN (SELECT e.photo_url FROM events e WHERE e.id = c.context_id) END
    ) AS context_photo_url,
    CASE
      WHEN c.context_type = 'announcement' THEN EXISTS(SELECT 1 FROM announcements a WHERE a.id = c.context_id AND a.suspended_at IS NULL)
      WHEN c.context_type = 'initiative' THEN EXISTS(SELECT 1 FROM initiatives i WHERE i.id = c.context_id AND i.suspended_at IS NULL)
      WHEN c.context_type = 'event' THEN EXISTS(SELECT 1 FROM events e WHERE e.id = c.context_id AND e.suspended_at IS NULL)
      ELSE true
    END AS context_available,
    c.updated_at,
    c.last_message_at,
    c.last_message_preview,
    c.last_message_sender_id,
    my.archived_at,
    my.last_read_at,
    CASE WHEN c.participant_a = auth.uid() THEN c.participant_b ELSE c.participant_a END AS other_user_id,
    p.display_name AS other_display_name,
    p.avatar_url AS other_avatar_url,
    (
      SELECT count(*)::int
      FROM public.messages m
      WHERE m.conversation_id = c.id
        AND m.sender_id <> auth.uid()
        AND (my.last_read_at IS NULL OR m.created_at > my.last_read_at)
    ) AS unread_count
  FROM my
  INNER JOIN public.conversations c ON c.id = my.conversation_id
  LEFT JOIN public.profiles p
    ON p.user_id = (
      CASE WHEN c.participant_a = auth.uid() THEN c.participant_b ELSE c.participant_a END
    )
  WHERE c.commune_id = p_commune_id
  ORDER BY c.last_message_at DESC NULLS LAST, c.updated_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.list_my_conversations(uuid, boolean) TO authenticated;

-- =============================================================================
-- Seed report notification email templates
-- =============================================================================

INSERT INTO public.email_templates (slug, subject, body_html, description) VALUES
(
  'report-notification-staff',
  'Nouveau signalement sur {{commune_name}}',
  '<h2>Nouveau signalement</h2><p>Un contenu a été signalé sur votre commune <strong>{{commune_name}}</strong>.</p><p><strong>Type :</strong> {{content_type}}<br/><strong>Titre :</strong> {{content_title}}<br/><strong>Signalé par :</strong> {{reporter_name}}<br/><strong>Date :</strong> {{report_date}}</p><p><strong>Motif :</strong></p><p>{{reason}}</p><p><a href="{{moderation_url}}">Voir les signalements</a></p><p>— {{app_name}}</p>',
  'Envoyé au staff/maire de la commune lorsqu''un contenu est signalé.'
),
(
  'report-notification-admin',
  '[Admin] Signalement sur {{commune_name}}',
  '<h2>Signalement plateforme</h2><p>Un contenu a été signalé sur la commune <strong>{{commune_name}}</strong>.</p><p><strong>Type :</strong> {{content_type}}<br/><strong>Titre :</strong> {{content_title}}<br/><strong>Signalé par :</strong> {{reporter_name}}<br/><strong>Date :</strong> {{report_date}}</p><p><strong>Motif :</strong></p><p>{{reason}}</p><p><a href="{{moderation_url}}">Voir dans le backoffice</a></p><p>— {{app_name}}</p>',
  'Envoyé aux admins plateforme lorsqu''un contenu est signalé.'
)
ON CONFLICT (slug) DO NOTHING;

COMMIT;
