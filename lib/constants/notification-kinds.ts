import { Bell, type LucideIcon } from "lucide-react";
import { CONTENT_TYPE_TAGS } from "@/lib/constants/content-types";
import type { ContentContextStatus } from "@/lib/constants/content-status";
import { ROUTES } from "@/lib/constants/routes";
import type { ConversationContextType } from "@/lib/types";

/** Persisted in `notifications.kind` — keep in sync with the DB CHECK constraint. */
export const NOTIFICATION_KINDS = [
  "new_content",
  "engagement",
  "nudge",
  "initiative_to_event",
  "system",
] as const;

export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];

export function isNotificationKind(value: string): value is NotificationKind {
  return (NOTIFICATION_KINDS as readonly string[]).includes(value);
}

/** Visual identity for notifications that are not bound to a content type. */
const SYSTEM_VISUAL = {
  icon: Bell,
  className: "bg-purple/10 text-purple",
} as const;

export type NotificationVisual = { icon: LucideIcon; className: string };

/**
 * Icon + pastel classes for a notification row. Content-bound kinds reuse
 * `CONTENT_TYPE_TAGS` so colors never diverge from tags and the inbox.
 */
export function getNotificationVisual(input: {
  kind: NotificationKind;
  context_type: ConversationContextType | null;
}): NotificationVisual {
  if (input.kind === "system" || !input.context_type) return SYSTEM_VISUAL;
  const tag = CONTENT_TYPE_TAGS[input.context_type];
  return { icon: tag.icon, className: tag.className };
}

/** Detail route builder per content type (shared with the fan-out). */
export const CONTENT_ROUTE_BUILDER: Record<
  ConversationContextType,
  (id: string) => string
> = {
  announcement: (id) => ROUTES.annonces.detail(id),
  initiative: (id) => ROUTES.initiatives.detail(id),
  event: (id) => ROUTES.evenements.detail(id),
};

export type NotificationHrefInput = {
  kind: NotificationKind;
  context_type: ConversationContextType | null;
  context_id: string | null;
  context_status: ContentContextStatus;
  is_author: boolean;
  payload: Record<string, unknown>;
};

/**
 * Whether the current user may open the related content from this row.
 * Only the author can reach a content that is no longer available
 * (finished, archived, suspended); nobody can reach a deleted one.
 */
export function isNotificationNavigable(input: {
  kind: NotificationKind;
  context_status: ContentContextStatus;
  is_author: boolean;
}): boolean {
  if (input.kind === "system") return true;
  if (input.context_status === "deleted") return false;
  if (input.context_status === "available") return true;
  return input.is_author;
}

/**
 * Target URL for a notification row, rebuilt from `context_type` / `context_id`
 * through the central route builders (never trust a frozen URL for content).
 * Falls back to `payload.url` for system notifications. Returns `null` when the
 * row is not navigable for the current user.
 */
export function buildNotificationHref(input: NotificationHrefInput): string | null {
  if (!isNotificationNavigable(input)) return null;

  if (input.context_type && input.context_id) {
    return CONTENT_ROUTE_BUILDER[input.context_type](input.context_id);
  }

  const url = input.payload.url;
  if (typeof url === "string" && url.startsWith("/")) return url;
  return null;
}
