-- Accueil outcome banner: all-time fulfilled counts (no week/month window).

BEGIN;

DROP FUNCTION IF EXISTS public.commune_outcome_banner_stats(uuid);

CREATE OR REPLACE FUNCTION public.commune_outcome_banner_stats(p_commune_id uuid)
RETURNS TABLE (
  demands integer,
  offers  integer,
  events  integer
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_active_membership(p_commune_id) THEN
    RETURN QUERY SELECT 0, 0, 0;
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    count(*) FILTER (
      WHERE co.content_kind = 'announcement'
        AND co.content_type = 'demande'
    )::integer,
    count(*) FILTER (
      WHERE co.content_kind = 'announcement'
        AND co.content_type = 'offre'
    )::integer,
    count(*) FILTER (
      WHERE co.content_kind = 'event'
    )::integer
  FROM public.content_outcomes co
  WHERE co.commune_id = p_commune_id
    AND co.outcome = 'fulfilled';
END;
$$;

GRANT EXECUTE ON FUNCTION public.commune_outcome_banner_stats(uuid) TO authenticated;

COMMIT;
