-- Hide trial_access_code from anon role (primary attack vector: unauthenticated signup).
-- Authenticated users (staff/admin) retain full access; resident code never selects this column.

-- 1. Revoke table-level SELECT from anon (column-level grants only work without table-level grant)
REVOKE SELECT ON public.communes FROM anon;

-- 2. Grant SELECT on all columns EXCEPT trial_access_code to anon
GRANT SELECT (
  id, insee_code, name, postcode, department,
  centroid_lat, centroid_lng, access_status,
  settings, created_at, subscribed_since, trial_max_members
) ON public.communes TO anon;
