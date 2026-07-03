-- Supports paginated habitants list: recent sort + inscription date filter per commune.
CREATE INDEX IF NOT EXISTS idx_memberships_commune_created_at
  ON public.memberships (commune_id, created_at DESC);
