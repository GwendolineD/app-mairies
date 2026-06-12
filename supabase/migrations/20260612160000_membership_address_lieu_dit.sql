-- Optional locality name (lieu-dit) on resident membership address.
ALTER TABLE public.memberships ADD COLUMN IF NOT EXISTS address_lieu_dit text;
