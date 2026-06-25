-- Validate trial access code without exposing the stored value to the client.
CREATE OR REPLACE FUNCTION public.validate_trial_access_code(
  p_commune_id uuid,
  p_code text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.communes
    WHERE id = p_commune_id
      AND trial_access_code IS NOT NULL
      AND upper(regexp_replace(trim(trial_access_code), '\s+', '', 'g'))
        = upper(regexp_replace(trim(p_code), '\s+', '', 'g'))
  );
$$;

GRANT EXECUTE ON FUNCTION public.validate_trial_access_code(uuid, text) TO anon, authenticated;
