/**
 * Availability of a content row (announcement / initiative / event) as seen
 * from a reference to it (conversation, notification).
 *
 * - available: visible to everyone
 * - finished: fulfilled / expired announcement, past or archived event, archived initiative
 * - archived: announcement in the 30-day trash
 * - suspended: moderated
 * - deleted: row no longer exists
 */
export type ContentContextStatus =
  | "available"
  | "finished"
  | "archived"
  | "suspended"
  | "deleted";

export const CONTENT_STATUS_VALUES: readonly ContentContextStatus[] = [
  "available",
  "finished",
  "archived",
  "suspended",
  "deleted",
];

/** Badge labels for a content that is no longer available. */
export const CONTENT_STATUS_LABELS: Record<
  Exclude<ContentContextStatus, "available">,
  string
> = {
  finished: "Contenu terminé",
  archived: "Contenu supprimé",
  suspended: "Contenu suspendu",
  deleted: "Contenu supprimé",
};

export function isContentContextStatus(value: string): value is ContentContextStatus {
  return (CONTENT_STATUS_VALUES as readonly string[]).includes(value);
}
