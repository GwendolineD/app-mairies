import { readFileSync } from "node:fs";
import { join } from "node:path";

function readSeedHtml(filename: string): string {
  return readFileSync(join(process.cwd(), "lib/legal", filename), "utf8").trim();
}

export const LEGAL_DOCUMENT_SLUGS = {
  cgu: "cgu",
  privacy: "politique-confidentialite",
} as const;

export type LegalDocumentSlug =
  (typeof LEGAL_DOCUMENT_SLUGS)[keyof typeof LEGAL_DOCUMENT_SLUGS];

export const LEGAL_DOCUMENT_SEED = {
  [LEGAL_DOCUMENT_SLUGS.cgu]: {
    title: "Conditions Générales d'Utilisation",
    contentHtml: readSeedHtml("cgu-seed.html"),
  },
  [LEGAL_DOCUMENT_SLUGS.privacy]: {
    title: "Politique de confidentialité",
    contentHtml: readSeedHtml("privacy-seed.html"),
  },
} as const;

export function isLegalDocumentSlug(value: string): value is LegalDocumentSlug {
  return value === LEGAL_DOCUMENT_SLUGS.cgu || value === LEGAL_DOCUMENT_SLUGS.privacy;
}
