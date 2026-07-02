-- Error boundary illustration URLs (singleton platform_settings)

ALTER TABLE public.platform_settings
  ADD COLUMN IF NOT EXISTS error_illustration_urls jsonb NOT NULL DEFAULT '[]'::jsonb;

UPDATE public.platform_settings
SET error_illustration_urls = '[
  "https://res.cloudinary.com/du3ko16j1/image/upload/v1779975389/app-mairies/illustrations/autres/hero-community_zweexd.png",
  "https://res.cloudinary.com/du3ko16j1/image/upload/v1781859089/app-mairies/illustrations/autres/accueil-bg3_wth5dx.png",
  "https://res.cloudinary.com/du3ko16j1/image/upload/v1781795828/app-mairies/illustrations/autres/invitation_scekel.png"
]'::jsonb
WHERE id = 1
  AND error_illustration_urls = '[]'::jsonb;
