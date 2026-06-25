-- Residents need SELECT on their own rows for INSERT ... RETURNING via PostgREST (.insert().select()).

BEGIN;

CREATE POLICY support_requests_select_own ON public.support_requests
FOR SELECT
USING (user_id = auth.uid());

COMMIT;
