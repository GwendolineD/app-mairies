-- Supabase hosted installs extensions in the `extensions` schema.
-- Later migrations use uuid_generate_v4() without a schema prefix; expose it in public when missing.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

DO $migrate$
BEGIN
  IF to_regprocedure('public.uuid_generate_v4()') IS NULL THEN
    EXECUTE $func$
      CREATE FUNCTION public.uuid_generate_v4()
      RETURNS uuid
      LANGUAGE sql
      VOLATILE
      SET search_path = extensions, public
      AS $body$ SELECT extensions.uuid_generate_v4(); $body$;
    $func$;
  END IF;
END;
$migrate$;
