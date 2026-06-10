-- Vie Locale: conversation uniqueness, user reports, initiative/event addresses, profile bio

-- Extend context_type for user reports
ALTER TYPE public.context_type ADD VALUE IF NOT EXISTS 'user';

-- Conversation pair normalization for idempotent upsert
ALTER TABLE public.conversations
ADD COLUMN IF NOT EXISTS participant_a uuid REFERENCES auth.users (id) ON DELETE CASCADE;

ALTER TABLE public.conversations
ADD COLUMN IF NOT EXISTS participant_b uuid REFERENCES auth.users (id) ON DELETE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS conversations_context_pair_unique
ON public.conversations (
  commune_id,
  context_type,
  context_id,
  participant_a,
  participant_b
)
WHERE
  context_type IS NOT NULL
  AND context_id IS NOT NULL
  AND participant_a IS NOT NULL
  AND participant_b IS NOT NULL;

-- Initiatives: category + optional address
ALTER TABLE public.initiatives
ADD COLUMN IF NOT EXISTS category_slug text;

ALTER TABLE public.initiatives
ADD COLUMN IF NOT EXISTS address_label text;

-- Events: address label
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS address_label text;

-- Profile bio for editable profil
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS bio text;
