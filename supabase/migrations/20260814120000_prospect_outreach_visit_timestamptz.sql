-- Store visit / council demo times on existing columns (date -> timestamptz)

BEGIN;

ALTER TABLE public.prospect_outreach
  ALTER COLUMN visit_1_at TYPE timestamptz
    USING (
      CASE
        WHEN visit_1_at IS NULL THEN NULL
        ELSE ((visit_1_at::text || ' 00:00:00')::timestamp AT TIME ZONE 'Europe/Paris')
      END
    ),
  ALTER COLUMN visit_2_at TYPE timestamptz
    USING (
      CASE
        WHEN visit_2_at IS NULL THEN NULL
        ELSE ((visit_2_at::text || ' 00:00:00')::timestamp AT TIME ZONE 'Europe/Paris')
      END
    ),
  ALTER COLUMN council_demo_at TYPE timestamptz
    USING (
      CASE
        WHEN council_demo_at IS NULL THEN NULL
        ELSE ((council_demo_at::text || ' 00:00:00')::timestamp AT TIME ZONE 'Europe/Paris')
      END
    );

COMMIT;
