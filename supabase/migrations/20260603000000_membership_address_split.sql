-- Split membership address: replace address_label with structured columns.
-- address_city is set at signup; address_street is filled later in the app.
ALTER TABLE public.memberships ADD COLUMN address_street text;
ALTER TABLE public.memberships ADD COLUMN address_city text;

-- Backfill city from the related commune for existing memberships.
UPDATE public.memberships m
SET address_city = c.name
FROM public.communes c
WHERE m.commune_id = c.id
  AND m.address_city IS NULL;

ALTER TABLE public.memberships DROP COLUMN address_label;
