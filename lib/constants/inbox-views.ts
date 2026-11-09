/** Inbox views exposed as URL path segments under `/messages`. */
export const INBOX_VIEWS = ["boite", "corbeille"] as const;

export type InboxView = (typeof INBOX_VIEWS)[number];

/** Maps a view to the `archived` flag expected by the inbox RPC. */
export function isArchivedView(view: InboxView): boolean {
  return view === "corbeille";
}
