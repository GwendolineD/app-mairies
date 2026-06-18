-- Profile preferences and editable commune email templates.

CREATE TABLE public.commune_email_templates (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4 (),
  commune_id uuid NOT NULL REFERENCES public.communes (id) ON DELETE CASCADE,
  template_key text NOT NULL,
  subject text NOT NULL,
  preheader text,
  body_markdown text NOT NULL,
  cta_label text NOT NULL DEFAULT 'Rejoindre Vie Locale',
  created_at timestamptz NOT NULL DEFAULT now (),
  updated_at timestamptz NOT NULL DEFAULT now (),
  CONSTRAINT commune_email_templates_key_check CHECK (
    template_key IN ('neighbor_invite')
  ),
  UNIQUE (commune_id, template_key)
);

CREATE TRIGGER trg_commune_email_templates_updated_at
BEFORE UPDATE ON public.commune_email_templates
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at ();

CREATE TABLE public.profile_notification_preferences (
  user_id uuid PRIMARY KEY REFERENCES public.profiles (user_id) ON DELETE CASCADE,
  message_notifications_enabled boolean NOT NULL DEFAULT true,
  announcement_notifications_enabled boolean NOT NULL DEFAULT true,
  initiative_notifications_enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now ()
);

CREATE TRIGGER trg_profile_notification_preferences_updated_at
BEFORE UPDATE ON public.profile_notification_preferences
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at ();

ALTER TABLE public.commune_email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY commune_email_templates_select ON public.commune_email_templates FOR SELECT
USING (
  public.can_access_commune_content (commune_id)
  OR public.is_municipality_staff_for_commune (commune_id)
  OR public.is_platform_admin ()
);

CREATE POLICY commune_email_templates_insert ON public.commune_email_templates FOR INSERT
WITH CHECK (
  public.is_municipality_staff_for_commune (commune_id)
  OR public.is_platform_admin ()
);

CREATE POLICY commune_email_templates_update ON public.commune_email_templates FOR UPDATE
USING (
  public.is_municipality_staff_for_commune (commune_id)
  OR public.is_platform_admin ()
)
WITH CHECK (
  public.is_municipality_staff_for_commune (commune_id)
  OR public.is_platform_admin ()
);

CREATE POLICY commune_email_templates_delete ON public.commune_email_templates FOR DELETE
USING (
  public.is_municipality_staff_for_commune (commune_id)
  OR public.is_platform_admin ()
);

CREATE POLICY profile_notification_preferences_select ON public.profile_notification_preferences FOR SELECT
USING (user_id = auth.uid () OR public.is_platform_admin ());

CREATE POLICY profile_notification_preferences_insert ON public.profile_notification_preferences FOR INSERT
WITH CHECK (user_id = auth.uid ());

CREATE POLICY profile_notification_preferences_update ON public.profile_notification_preferences FOR UPDATE
USING (user_id = auth.uid () OR public.is_platform_admin ())
WITH CHECK (user_id = auth.uid () OR public.is_platform_admin ());

CREATE POLICY profile_notification_preferences_delete ON public.profile_notification_preferences FOR DELETE
USING (user_id = auth.uid () OR public.is_platform_admin ());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.commune_email_templates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profile_notification_preferences TO authenticated;

INSERT INTO public.commune_email_templates (
  commune_id,
  template_key,
  subject,
  preheader,
  body_markdown,
  cta_label
)
SELECT
  c.id,
  'neighbor_invite',
  '{{sender_name}} vous invite sur Vie Locale {{commune_name}}',
  'Un espace local pour découvrir les initiatives, partager des annonces et s''entraider entre voisins.',
  'Bonjour,

{{sender_name}} vous invite à rejoindre Vie Locale {{commune_name}}, l''espace convivial pour découvrir ce qui se passe près de chez vous, proposer un coup de main et rencontrer des voisins bienveillants.

En quelques minutes, vous pourrez voir les annonces utiles, les initiatives locales et les événements de la commune.

{{invite_link}}

À très vite sur Vie Locale !',
  'Rejoindre Vie Locale'
FROM public.communes c
ON CONFLICT (commune_id, template_key) DO NOTHING;
