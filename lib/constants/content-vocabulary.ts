/**
 * User-facing vocabulary for the "initiative" content type.
 *
 * The code, database, routes, enums and every technical key keep the word
 * `initiative`; only the copy shown to users says « idée ». Keep every visible
 * form here so the wording never drifts between screens.
 *
 * This module must stay import-free so `content-types.ts` can depend on it
 * without creating a cycle.
 */
export const INITIATIVE_VOCAB = {
  /** Lowercase singular: « une idée », « votre idée ». */
  singular: "idée",
  /** Lowercase plural: « vos idées ». */
  plural: "idées",
  /** Capitalized singular — content tag, badges, placeholders. */
  tag: "Idée",
  /** Capitalized plural — nav item, tabs, stat labels. */
  labelShort: "Idées",
  /** Title of the resident list page. */
  listTitle: "Toutes les idées",
  /** Creation CTA. */
  ctaCreate: "Proposer une idée",
  /** Form submit button. */
  ctaPublish: "Publier mon idée",
} as const;

/** « Aucune idée » | « 1 idée » | « 12 idées ». */
export function formatInitiativeCount(count: number): string {
  if (count === 0) return `Aucune ${INITIATIVE_VOCAB.singular}`;
  if (count === 1) return `1 ${INITIATIVE_VOCAB.singular}`;
  return `${count} ${INITIATIVE_VOCAB.plural}`;
}
