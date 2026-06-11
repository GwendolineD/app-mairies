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

  -- Profiles (trigger may have created rows; upsert is_platform_admin)
  INSERT INTO public.profiles (
    user_id,
    first_name,
    last_name,
    display_name,
    active_commune_id,
    is_platform_admin
  )
  VALUES
    (
      v_admin_id,
      'Gwendoline',
      'Dubois',
      'Gwendoline D.',
      v_commune_id,
      true
    ),
    (
      v_mairie_id,
      'Référent',
      'Mairie',
      'Référent M.',
      v_commune_id,
      false
    )
  ON CONFLICT (user_id) DO UPDATE SET
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    display_name = excluded.display_name,
    active_commune_id = excluded.active_commune_id,
    is_platform_admin = excluded.is_platform_admin,
    updated_at = now();

  -- Memberships (habitant actif dans la commune pilote)
  INSERT INTO public.memberships (
    user_id,
    commune_id,
    address_street,
    address_city,
    address_citycode,
    address_postcode,
    address_lat,
    address_lng,
    is_primary,
    status,
    role
  )
  VALUES
    (
      v_admin_id,
      v_commune_id,
      NULL,
      'Les Authieux',
      '27027',
      '27220',
      48.8978,
      1.2338,
      true,
      'active',
      'member'
    ),
    (
      v_mairie_id,
      v_commune_id,
      NULL,
      'Les Authieux',
      '27027',
      '27220',
      48.8978,
      1.2338,
      true,
      'active',
      'staff'
    )
  ON CONFLICT (user_id, commune_id) DO UPDATE SET
    address_street = excluded.address_street,
    address_city = excluded.address_city,
    status = 'active',
    role = excluded.role,
    updated_at = now();

END $$;
