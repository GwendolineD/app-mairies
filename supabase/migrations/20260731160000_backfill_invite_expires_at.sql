-- Backfill expires_at for neighbor invites created without an expiration date.
-- Business rule: invitations are valid for 30 days from creation.
UPDATE public.neighbor_invites
SET expires_at = created_at + INTERVAL '30 days'
WHERE expires_at IS NULL;
