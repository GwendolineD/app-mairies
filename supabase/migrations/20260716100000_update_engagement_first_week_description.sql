-- Align engagement-first-week template description with 3-30 day eligibility window.

UPDATE public.email_templates
SET description = 'Email d''engagement envoyé aux inscrits de 3-30 jours sans publication'
WHERE slug = 'engagement-first-week';
