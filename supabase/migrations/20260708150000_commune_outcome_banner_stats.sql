-- Single RPC for resident accueil outcome banner (week + month counts in one scan).

BEGIN;

CREATE OR REPLACE FUNCTION public.commune_outcome_banner_stats(p_commune_id uuid)
RETURNS TABLE (
  demands_week  integer,
  demands_month integer,
  offers_week   integer,
  offers_month  integer,
  events_week   integer,
  events_month  integer
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  week_start timestamptz := date_trunc('week', now() AT TIME ZONE 'Europe/Paris') AT TIME ZONE 'Europe/Paris';
  month_start timestamptz := date_trunc('month', now() AT TIME ZONE 'Europe/Paris') AT TIME ZONE 'Europe/Paris';
BEGIN
  IF NOT public.has_active_membership(p_commune_id) THEN
    RETURN QUERY SELECT 0, 0, 0, 0, 0, 0;
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    count(*) FILTER (
      WHERE co.content_kind = 'announcement'
        AND co.content_type = 'demande'
        AND co.recorded_at >= week_start
    )::integer,
    count(*) FILTER (
      WHERE co.content_kind = 'announcement'
        AND co.content_type = 'demande'
        AND co.recorded_at >= month_start
    )::integer,
    count(*) FILTER (
      WHERE co.content_kind = 'announcement'
        AND co.content_type = 'offre'
        AND co.recorded_at >= week_start
    )::integer,
    count(*) FILTER (
      WHERE co.content_kind = 'announcement'
        AND co.content_type = 'offre'
        AND co.recorded_at >= month_start
    )::integer,
    count(*) FILTER (
      WHERE co.content_kind = 'event'
        AND co.recorded_at >= week_start
    )::integer,
    count(*) FILTER (
      WHERE co.content_kind = 'event'
        AND co.recorded_at >= month_start
    )::integer
  FROM public.content_outcomes co
  WHERE co.commune_id = p_commune_id
    AND co.outcome = 'fulfilled'
    AND co.recorded_at >= month_start;
END;
$$;

GRANT EXECUTE ON FUNCTION public.commune_outcome_banner_stats(uuid) TO authenticated;

COMMIT;
