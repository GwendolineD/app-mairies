-- Vie Locale — Backoffice: add 'suspended' commune lifecycle state.
-- Kept in its own migration so the new enum value is committed before any
-- later migration (or SQL function body) references it.

ALTER TYPE public.subscription_status ADD VALUE IF NOT EXISTS 'suspended';
