import { DAY_MS } from "@/lib/datetime";

export type NudgeableContent = {
  contentType: "announcement" | "initiative" | "event";
  status: string;
  targetDate?: string | null;
  endsAt?: string | null;
  createdAt: string;
  nudgeSnoozedUntil?: string | null;
};

export type NudgeReason =
  | "announcement_expired"
  | "announcement_stale"
  | "initiative_stale"
  | "event_past";

const EXPIRED_DELAY_DAYS = 2;
const STALE_DELAY_DAYS = 60;
const EVENT_PAST_DELAY_DAYS = 2;

function isSnoozed(nudgeSnoozedUntil: string | null | undefined, now: Date): boolean {
  if (!nudgeSnoozedUntil) return false;
  return new Date(nudgeSnoozedUntil).getTime() > now.getTime();
}

/**
 * Single source of truth for content nudge eligibility.
 * Used by: cron collector, detail page banner, profile card badge.
 */
export function getContentNudgeReason(
  content: NudgeableContent,
  now: Date = new Date(),
): NudgeReason | null {
  if (isSnoozed(content.nudgeSnoozedUntil, now)) return null;

  if (content.contentType === "announcement") {
    if (content.status !== "ouverte") return null;

    if (content.targetDate) {
      const target = new Date(content.targetDate + "T00:00:00");
      const threshold = now.getTime() - EXPIRED_DELAY_DAYS * DAY_MS;
      if (target.getTime() < threshold) return "announcement_expired";
    } else {
      const created = new Date(content.createdAt).getTime();
      const threshold = now.getTime() - STALE_DELAY_DAYS * DAY_MS;
      if (created < threshold) return "announcement_stale";
    }
  }

  if (content.contentType === "initiative") {
    if (content.status !== "active") return null;
    const created = new Date(content.createdAt).getTime();
    const threshold = now.getTime() - STALE_DELAY_DAYS * DAY_MS;
    if (created < threshold) return "initiative_stale";
  }

  if (content.contentType === "event") {
    if (content.status !== "active") return null;
    if (!content.endsAt) return null;
    const endsAt = new Date(content.endsAt).getTime();
    const threshold = now.getTime() - EVENT_PAST_DELAY_DAYS * DAY_MS;
    if (endsAt < threshold) return "event_past";
  }

  return null;
}

/** Profile/list cards: coral border (2px) when action is required. */
export function contentActionRequiredCardBorder(
  actionRequired: boolean,
  defaultHoverBorder: string,
): string {
  return actionRequired
    ? "border-2 border-coral hover:border-coral"
    : defaultHoverBorder;
}
