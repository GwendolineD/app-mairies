-- Remove unused RPC superseded by commune_outcome_banner_stats.

BEGIN;

DROP FUNCTION IF EXISTS public.commune_fulfilled_demands_this_week(uuid);

COMMIT;
