import { isSameParisDay, startOfParisWeek } from "@/lib/datetime";
import type { NotificationItem } from "@/lib/types";

export const NOTIFICATION_GROUPS = ["today", "week", "older"] as const;
export type NotificationGroupKey = (typeof NOTIFICATION_GROUPS)[number];

export const NOTIFICATION_GROUP_LABELS: Record<NotificationGroupKey, string> = {
  today: "Aujourd'hui",
  week: "Cette semaine",
  older: "Plus ancien",
};

/**
 * Bucket a notification by its creation instant, in Paris time.
 * `now` is injected so server and client agree on the result (no hydration drift).
 */
export function getNotificationGroup(
  createdAt: string,
  now: Date | string,
): NotificationGroupKey {
  if (isSameParisDay(createdAt, now)) return "today";
  const created = new Date(createdAt);
  if (created >= startOfParisWeek(now)) return "week";
  return "older";
}

export type NotificationGroup = {
  key: NotificationGroupKey;
  label: string;
  items: NotificationItem[];
};

/** Group items (already sorted newest first) preserving group order; empty groups dropped. */
export function groupNotifications(
  items: NotificationItem[],
  now: Date | string,
): NotificationGroup[] {
  const buckets = new Map<NotificationGroupKey, NotificationItem[]>();
  for (const item of items) {
    const key = getNotificationGroup(item.created_at, now);
    const bucket = buckets.get(key);
    if (bucket) bucket.push(item);
    else buckets.set(key, [item]);
  }
  return NOTIFICATION_GROUPS.filter((key) => buckets.has(key)).map((key) => ({
    key,
    label: NOTIFICATION_GROUP_LABELS[key],
    items: buckets.get(key)!,
  }));
}
