/**
 * Data retention durations (in days) applied by the lifecycle cron.
 * Keep every TTL here so the privacy policy and the code stay in sync.
 */
export const RETENTION_DAYS = {
  /** Archived announcements and conversations (trash) before hard delete. */
  archivedContent: 30,
  /** In-app notifications already read. */
  notificationsRead: 60,
  /** In-app notifications never read. */
  notificationsUnread: 180,
} as const;
