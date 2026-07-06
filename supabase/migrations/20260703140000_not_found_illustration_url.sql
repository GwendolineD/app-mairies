-- Not-found page illustration URL (singleton platform_settings)

ALTER TABLE public.platform_settings
  ADD COLUMN IF NOT EXISTS not_found_illustration_url text;

UPDATE public.platform_settings
SET not_found_illustration_url = 'https://res.cloudinary.com/du3ko16j1/image/upload/v1779975389/app-mairies/illustrations/autres/hero-community_zweexd.png'
WHERE id = 1
  AND not_found_illustration_url IS NULL;
