-- Store human-readable address snapshot on announcements (immutable at publish time).
ALTER TABLE public.announcements
  ADD COLUMN address_street text,
  ADD COLUMN address_city text,
  ADD COLUMN address_citycode text,
  ADD COLUMN address_postcode text;

COMMENT ON COLUMN public.announcements.address_street IS 'Street line snapshot at publish time';
COMMENT ON COLUMN public.announcements.address_city IS 'City snapshot at publish time';
COMMENT ON COLUMN public.announcements.address_citycode IS 'INSEE city code snapshot at publish time';
COMMENT ON COLUMN public.announcements.address_postcode IS 'Postcode snapshot at publish time';
