import { writeFileSync } from "node:fs";
import { LEGAL_DOCUMENT_SEED, LEGAL_DOCUMENT_SLUGS } from "../lib/legal/seed-content";

function sqlEscape(value: string): string {
  return value.replace(/'/g, "''");
}

const rows: [string, string, string][] = [
  [
    LEGAL_DOCUMENT_SLUGS.cgu,
    LEGAL_DOCUMENT_SEED[LEGAL_DOCUMENT_SLUGS.cgu].title,
    LEGAL_DOCUMENT_SEED[LEGAL_DOCUMENT_SLUGS.cgu].contentHtml,
  ],
  [
    LEGAL_DOCUMENT_SLUGS.privacy,
    LEGAL_DOCUMENT_SEED[LEGAL_DOCUMENT_SLUGS.privacy].title,
    LEGAL_DOCUMENT_SEED[LEGAL_DOCUMENT_SLUGS.privacy].contentHtml,
  ],
];

const inserts = rows
  .map(
    ([slug, title, html]) =>
      `  ('${slug}', '${sqlEscape(title)}', '${sqlEscape(html)}', '{}'::jsonb, now())`,
  )
  .join(",\n");

const sql = `-- Legal documents (CGU / Privacy Policy)
CREATE TABLE public.legal_documents (
  slug text PRIMARY KEY,
  title text NOT NULL,
  content_html text NOT NULL DEFAULT '',
  content_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  version integer NOT NULL DEFAULT 1,
  published_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY legal_documents_select ON public.legal_documents
  FOR SELECT USING (true);

CREATE POLICY legal_documents_update ON public.legal_documents
  FOR UPDATE USING (public.is_platform_admin());

INSERT INTO public.legal_documents (slug, title, content_html, content_json, published_at)
VALUES
${inserts};
`;

writeFileSync("supabase/migrations/20260623000000_legal_documents.sql", sql);
console.log(`Migration written (${sql.length} bytes)`);
