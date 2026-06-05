-- =============================================================================
-- Vie Locale — LOCAL DEV SEED (supabase db reset)
-- Pilot commune: Les Authieux (27220, Eure)
-- Default password for seeded accounts: VieLocaleDev2026!
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Fixed IDs for reproducible local dev
-- Commune Les Authieux (INSEE 27027)
-- Platform admin: dubois.gwendoline@hotmail.fr
-- Municipality staff: mairie.les-authieux@vie-locale.dev

DO $$
DECLARE
  v_commune_id uuid := '27027000-0000-4000-8000-000000000001';
  v_admin_id uuid := '27027000-0000-4000-8000-000000000010';
  v_mairie_id uuid := '27027000-0000-4000-8000-000000000020';
  v_pw text := crypt('VieLocaleDev2026!', gen_salt('bf'));
BEGIN
  -- Pilot commune (active subscription)
  INSERT INTO public.communes (
    id,
    insee_code,
    name,
    postcode,
    department,
    centroid_lat,
    centroid_lng,
    subscription_status,
    settings
  )
  VALUES (
    v_commune_id,
    '27027',
    'Les Authieux',
    '27220',
    'Eure',
    48.8978,
    1.2338,
    'active',
    jsonb_build_object(
      'welcomeMessage',
      'Bienvenue sur Vie Locale Les Authieux — découvrir, partager, s''entraider.'
    )
  )
  ON CONFLICT (insee_code) DO UPDATE SET
    name = excluded.name,
    postcode = excluded.postcode,
    department = excluded.department,
    centroid_lat = excluded.centroid_lat,
    centroid_lng = excluded.centroid_lng,
    subscription_status = excluded.subscription_status,
    settings = excluded.settings;

  -- Platform admin (backoffice éditeur)
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  )
  VALUES (
    v_admin_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'dubois.gwendoline@hotmail.fr',
    v_pw,
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"first_name":"Gwendoline","last_name":"Dubois","display_name":"Gwendoline D."}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  )
  ON CONFLICT (id) DO UPDATE SET
    email = excluded.email,
    encrypted_password = excluded.encrypted_password,
    raw_user_meta_data = excluded.raw_user_meta_data,
    updated_at = now();

  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    v_admin_id,
    v_admin_id,
    jsonb_build_object('sub', v_admin_id::text, 'email', 'dubois.gwendoline@hotmail.fr'),
    'email',
    v_admin_id::text,
    now(),
    now(),
    now()
  )
  ON CONFLICT (provider, provider_id) DO UPDATE SET
    identity_data = excluded.identity_data,
    updated_at = now();

  -- Municipality staff (dashboard mairie)
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  )
  VALUES (
    v_mairie_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'mairie.les-authieux@vie-locale.dev',
    v_pw,
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"first_name":"Référent","last_name":"Mairie","display_name":"Référent M."}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  )
  ON CONFLICT (id) DO UPDATE SET
    email = excluded.email,
    encrypted_password = excluded.encrypted_password,
    raw_user_meta_data = excluded.raw_user_meta_data,
    updated_at = now();

  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    v_mairie_id,
    v_mairie_id,
    jsonb_build_object('sub', v_mairie_id::text, 'email', 'mairie.les-authieux@vie-locale.dev'),
    'email',
    v_mairie_id::text,
    now(),
    now(),
    now()
  )
  ON CONFLICT (provider, provider_id) DO UPDATE SET
    identity_data = excluded.identity_data,
    updated_at = now();

  -- Profiles (trigger may have created rows; upsert roles)
  INSERT INTO public.profiles (
    user_id,
    first_name,
    last_name,
    display_name,
    active_commune_id,
    role
  )
  VALUES
    (
      v_admin_id,
      'Gwendoline',
      'Dubois',
      'Gwendoline D.',
      v_commune_id,
      'platform_admin'
    ),
    (
      v_mairie_id,
      'Référent',
      'Mairie',
      'Référent M.',
      v_commune_id,
      'municipality_staff'
    )
  ON CONFLICT (user_id) DO UPDATE SET
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    display_name = excluded.display_name,
    active_commune_id = excluded.active_commune_id,
    role = excluded.role,
    updated_at = now();

  -- Memberships (habitant actif dans la commune pilote)
  INSERT INTO public.memberships (
    user_id,
    commune_id,
    address_label,
    address_citycode,
    address_postcode,
    address_lat,
    address_lng,
    is_primary,
    status
  )
  VALUES
    (
      v_admin_id,
      v_commune_id,
      'Les Authieux, 27220',
      '27027',
      '27220',
      48.8978,
      1.2338,
      true,
      'active'
    ),
    (
      v_mairie_id,
      v_commune_id,
      'Mairie — Les Authieux, 27220',
      '27027',
      '27220',
      48.8978,
      1.2338,
      true,
      'active'
    )
  ON CONFLICT (user_id, commune_id) DO UPDATE SET
    address_label = excluded.address_label,
    status = 'active',
    updated_at = now();

END $$;

-- =============================================================================
-- Sample initiatives (local dev)
-- =============================================================================

DO $$
DECLARE
  v_commune_id uuid := '27027000-0000-4000-8000-000000000001';
  v_admin_id uuid := '27027000-0000-4000-8000-000000000010';
  v_membership_id uuid;
BEGIN
  SELECT id INTO v_membership_id
  FROM public.memberships
  WHERE user_id = v_admin_id AND commune_id = v_commune_id
  LIMIT 1;

  IF v_membership_id IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.initiatives (
    id,
    commune_id,
    author_membership_id,
    category_slug,
    title,
    description,
    date_mode,
    single_starts_at,
    single_ends_at,
    location_label,
    photo_url,
    status
  )
  VALUES
    (
      '27027000-0000-4000-8000-000000000101',
      v_commune_id,
      v_membership_id,
      'nature',
      'Nettoyons les bords de rivière',
      E'La rivière est un trésor de notre commune, mais elle a besoin de nous !\nRejoignez-nous pour une matinée de nettoyage des berges.\n\nTout le matériel sera fourni (gants, sacs, pinces). Pensez à vous munir de bottes ou de chaussures adaptées et d''une gourde.\n\nEnsemble, faisons la différence pour notre environnement !\n\nObjectifs\n- Préserver la biodiversité locale\n- Réduire la pollution des rivières\n- Créer du lien entre habitants\n- Sensibiliser à l''importance de notre environnement',
      'once',
      '2026-06-15 09:00:00+02',
      '2026-06-15 12:00:00+02',
      'Parking du Pont Neuf, Les Authieux',
      'https://images.unsplash.com/photo-1571687949921-1306bfb24b72?w=1200&q=80',
      'active'
    ),
    (
      '27027000-0000-4000-8000-000000000102',
      v_commune_id,
      v_membership_id,
      'convivialite',
      'Café des voisins du dimanche',
      E'Un moment chaleureux pour faire connaissance autour d''un café et de viennoiseries.\nTous les âges sont les bienvenus.',
      'recurring',
      null,
      null,
      'Salle des fêtes',
      null,
      'active'
    ),
    (
      '27027000-0000-4000-8000-000000000103',
      v_commune_id,
      v_membership_id,
      'jeunesse',
      'Atelier jardin partagé',
      E'Création d''un potager collectif géré par les habitant·es.\nVenez planter, arroser et récolter ensemble au fil des saisons.',
      'none',
      null,
      null,
      'Terrain communal, rue des Écoles',
      null,
      'active'
    )
  ON CONFLICT (id) DO UPDATE SET
    category_slug = excluded.category_slug,
    title = excluded.title,
    description = excluded.description,
    date_mode = excluded.date_mode,
    single_starts_at = excluded.single_starts_at,
    single_ends_at = excluded.single_ends_at,
    location_label = excluded.location_label,
    photo_url = excluded.photo_url,
    status = excluded.status;
END $$;
