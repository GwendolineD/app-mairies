-- Remove the orphan 'staff-invitation' email template.
-- All invitations now use the unified 'neighbor-invite' template.
DELETE FROM public.email_templates WHERE slug = 'staff-invitation';
