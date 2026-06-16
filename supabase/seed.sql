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
<<<<<<< HEAD
    subscription_status,
    subscription_started_at,
    subscription_ends_at,
    subscription_paid,
=======
    access_status,
>>>>>>> preprod
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
    now() - interval '8 months',
    now() + interval '4 months',
    true,
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
<<<<<<< HEAD
    subscription_status = excluded.subscription_status,
    subscription_started_at = excluded.subscription_started_at,
    subscription_ends_at = excluded.subscription_ends_at,
    subscription_paid = excluded.subscription_paid,
=======
    access_status = excluded.access_status,
>>>>>>> preprod
    settings = excluded.settings;

  INSERT INTO public.commune_email_templates (
    commune_id,
    template_key,
    subject,
    preheader,
    body_markdown,
    cta_label
  )
  VALUES (
    v_commune_id,
    'neighbor_invite',
    '{{sender_name}} vous invite sur Vie Locale {{commune_name}}',
    'Un espace local pour découvrir les initiatives, partager des annonces et s''entraider entre voisins.',
    'Bonjour,

{{sender_name}} vous invite à rejoindre Vie Locale {{commune_name}}, l''espace convivial pour découvrir ce qui se passe près de chez vous, proposer un coup de main et rencontrer des voisins bienveillants.

En quelques minutes, vous pourrez voir les annonces utiles, les initiatives locales et les événements de la commune.

{{invite_link}}

À très vite sur Vie Locale !',
    'Rejoindre Vie Locale'
  )
  ON CONFLICT (commune_id, template_key) DO UPDATE SET
    subject = excluded.subject,
    preheader = excluded.preheader,
    body_markdown = excluded.body_markdown,
    cta_label = excluded.cta_label,
    updated_at = now();

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
    address_street,
    address_city,
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
      NULL,
      'Les Authieux',
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
      NULL,
      'Les Authieux',
      '27027',
      '27220',
      48.8978,
      1.2338,
      true,
      'active'
    )
  ON CONFLICT (user_id, commune_id) DO UPDATE SET
    address_street = excluded.address_street,
    address_city = excluded.address_city,
    status = 'active',
    updated_at = now();

END $$;

-- =============================================================================
-- Backoffice demo data: extra client communes, residents, content & payments
-- Lets the platform backoffice show realistic clients / users / revenue.
-- Idempotent: fixed UUIDs + ON CONFLICT guards.
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
  v_pilot uuid := '27027000-0000-4000-8000-000000000001';
  v_c2 uuid := '27027000-0000-4000-8000-000000000002';
  v_c3 uuid := '27027000-0000-4000-8000-000000000003';
  v_c4 uuid := '27027000-0000-4000-8000-000000000004';
  v_pw text := crypt('VieLocaleDev2026!', gen_salt('bf'));
  v_uid uuid;
  v_mid uuid;
  v_target uuid;
  v_email text;
  i integer;
  v_cats text[] := ARRAY['bricolage','jardinage','numerique','covoiturage','animaux','alimentaire'];
BEGIN
  -- Extra client communes (varied plans / subscription states)
  INSERT INTO public.communes (id, insee_code, name, postcode, department, centroid_lat, centroid_lng, subscription_status, plan, monthly_amount_cents, billing_email, settings)
  VALUES
    (v_c2, '27681', 'Verneuil-sur-Avre', '27130', 'Eure', 48.7372, 0.9258, 'active', 'premium', 9900, 'compta@verneuil.fr', '{}'::jsonb),
    (v_c3, '27053', 'Brionne', '27800', 'Eure', 49.1936, 0.7178, 'trial', 'standard', 4900, 'mairie@brionne.fr', '{}'::jsonb),
    (v_c4, '27375', 'Pacy-sur-Eure', '27120', 'Eure', 49.0142, 1.3819, 'inactive', 'free', 0, NULL, '{}'::jsonb)
  ON CONFLICT (id) DO UPDATE SET
    name = excluded.name,
    postcode = excluded.postcode,
    department = excluded.department,
    subscription_status = excluded.subscription_status,
    plan = excluded.plan,
    monthly_amount_cents = excluded.monthly_amount_cents,
    billing_email = excluded.billing_email;

  -- Set billing on the pilot commune so revenue is visible there too
  UPDATE public.communes
  SET plan = 'standard', monthly_amount_cents = 4900, billing_email = 'mairie@les-authieux.fr'
  WHERE id = v_pilot AND monthly_amount_cents = 0;

  -- Resident demo accounts: 1..4 -> Verneuil (v_c2), 5..6 -> pilot
  FOR i IN 1..6 LOOP
    v_uid := ('27027000-0000-4000-9000-' || lpad((3000 + i)::text, 12, '0'))::uuid;
    v_email := 'habitant' || i || '@demo.vie-locale.dev';
    v_target := CASE WHEN i <= 4 THEN v_c2 ELSE v_pilot END;

    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
    )
    VALUES (
      v_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      v_email, v_pw, now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('first_name', 'Habitant', 'last_name', i::text, 'display_name', 'Habitant ' || i),
      now(), now(), '', '', '', ''
    )
    ON CONFLICT (id) DO UPDATE SET email = excluded.email, updated_at = now();

    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (
      v_uid, v_uid,
      jsonb_build_object('sub', v_uid::text, 'email', v_email),
      'email', v_uid::text, now(), now(), now()
    )
    ON CONFLICT (provider, provider_id) DO UPDATE SET identity_data = excluded.identity_data, updated_at = now();

    INSERT INTO public.profiles (user_id, first_name, last_name, display_name, active_commune_id, role)
    VALUES (v_uid, 'Habitant', i::text, 'Habitant ' || i, v_target, 'resident')
    ON CONFLICT (user_id) DO UPDATE SET active_commune_id = excluded.active_commune_id, role = 'resident', updated_at = now();

    INSERT INTO public.memberships (user_id, commune_id, address_label, address_citycode, address_postcode, address_lat, address_lng, is_primary, status)
    VALUES (
      v_uid, v_target, 'Adresse démo ' || i, '27681', '27130', 48.7372, 0.9258, true,
      (CASE WHEN i = 4 THEN 'suspended' ELSE 'active' END)::public.membership_status
    )
    ON CONFLICT (user_id, commune_id) DO UPDATE SET status = excluded.status, updated_at = now()
    RETURNING id INTO v_mid;

    -- A couple of announcements per resident
    INSERT INTO public.announcements (id, commune_id, author_membership_id, type, category_slug, title, description, status)
    VALUES
      (('27027000-0000-4a01-8000-' || lpad((3000 + i)::text, 12, '0'))::uuid,
        v_target, v_mid, 'demande', v_cats[(i % 6) + 1],
        'Besoin d''un coup de main #' || i, 'Annonce de démonstration.', 'ouverte'),
      (('27027000-0000-4a02-8000-' || lpad((3000 + i)::text, 12, '0'))::uuid,
        v_target, v_mid, 'offre', v_cats[((i + 2) % 6) + 1],
        'Je propose mon aide #' || i, 'Annonce de démonstration.', 'ouverte')
    ON CONFLICT (id) DO NOTHING;

    -- One initiative + one event for the first two residents
    IF i = 1 THEN
      INSERT INTO public.initiatives (id, commune_id, author_membership_id, title, description, date_mode, status)
      VALUES (('27027000-0000-4b01-8000-' || lpad((3000 + i)::text, 12, '0'))::uuid,
        v_target, v_mid, 'Nettoyage de printemps', 'Initiative de démonstration.', 'none', 'active')
      ON CONFLICT (id) DO NOTHING;
    END IF;

    IF i = 2 THEN
      INSERT INTO public.events (id, commune_id, author_membership_id, title, description, starts_at, ends_at, status)
      VALUES (('27027000-0000-4c01-8000-' || lpad((3000 + i)::text, 12, '0'))::uuid,
        v_target, v_mid, 'Fête des voisins', 'Événement de démonstration.',
        now() + interval '10 days', now() + interval '10 days 3 hours', 'active')
      ON CONFLICT (id) DO NOTHING;
    END IF;
  END LOOP;

  -- Payments / revenue history
  INSERT INTO public.commune_payments (id, commune_id, amount_cents, status, period_start, period_end, paid_at, note)
  VALUES
    (('27027000-0000-4d00-8000-000000000001')::uuid, v_c2, 9900, 'paid', current_date - 90, current_date - 60, now() - interval '85 days', 'Abonnement Premium'),
    (('27027000-0000-4d00-8000-000000000002')::uuid, v_c2, 9900, 'paid', current_date - 60, current_date - 30, now() - interval '55 days', 'Abonnement Premium'),
    (('27027000-0000-4d00-8000-000000000003')::uuid, v_c2, 9900, 'paid', current_date - 30, current_date, now() - interval '20 days', 'Abonnement Premium'),
    (('27027000-0000-4d00-8000-000000000004')::uuid, v_c2, 9900, 'pending', current_date, current_date + 30, NULL, 'Abonnement Premium'),
    (('27027000-0000-4d00-8000-000000000005')::uuid, v_pilot, 4900, 'paid', current_date - 30, current_date, now() - interval '15 days', 'Abonnement Standard'),
    (('27027000-0000-4d00-8000-000000000006')::uuid, v_c3, 4900, 'pending', current_date, current_date + 30, NULL, 'Essai Standard')
  ON CONFLICT (id) DO NOTHING;

END $$;
