-- Remove bulk-imported inactive communes (geo.api.gouv.fr one-shot import).
-- Pilot communes use subscription_status IN ('trial', 'active') only.

DELETE FROM public.communes
WHERE subscription_status = 'inactive';
