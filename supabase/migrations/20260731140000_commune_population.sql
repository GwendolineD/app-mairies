ALTER TABLE public.communes
  ADD COLUMN IF NOT EXISTS population integer;
