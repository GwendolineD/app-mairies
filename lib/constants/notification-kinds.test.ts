/**
 * Navigation contract of the notification center: who may open what, and
 * where a row points to. Routes are rebuilt from the content context, never
 * from a frozen payload URL.
 */
import { describe, expect, it } from "vitest";
import { ROUTES } from "@/lib/constants/routes";
import {
  buildNotificationHref,
  getNotificationVisual,
  isNotificationNavigable,
  type NotificationHrefInput,
} from "@/lib/constants/notification-kinds";
import { CONTENT_TYPE_TAGS } from "@/lib/constants/content-types";

const CONTENT_ID = "27027000-0000-4000-8000-0000000000a1";

function row(overrides: Partial<NotificationHrefInput> = {}): NotificationHrefInput {
  return {
    kind: "new_content",
    context_type: "announcement",
    context_id: CONTENT_ID,
    context_status: "available",
    is_author: false,
    payload: {},
    ...overrides,
  };
}

describe("isNotificationNavigable", () => {
  it("lets everyone open available content", () => {
    expect(isNotificationNavigable(row())).toBe(true);
  });

  it.each(["finished", "archived", "suspended"] as const)(
    "restricts %s content to its author",
    (status) => {
      expect(isNotificationNavigable(row({ context_status: status }))).toBe(false);
      expect(
        isNotificationNavigable(row({ context_status: status, is_author: true })),
      ).toBe(true);
    },
  );

  it("never navigates to deleted content, even for the author", () => {
    expect(
      isNotificationNavigable(row({ context_status: "deleted", is_author: true })),
    ).toBe(false);
  });

  it("always allows system notifications", () => {
    expect(
      isNotificationNavigable(row({ kind: "system", context_status: "deleted" })),
    ).toBe(true);
  });
});

describe("buildNotificationHref", () => {
  it.each([
    ["new_content", "announcement", ROUTES.annonces.detail(CONTENT_ID)],
    ["engagement", "initiative", ROUTES.initiatives.detail(CONTENT_ID)],
    ["nudge", "event", ROUTES.evenements.detail(CONTENT_ID)],
    ["initiative_to_event", "event", ROUTES.evenements.detail(CONTENT_ID)],
  ] as const)("%s on %s → detail route", (kind, contextType, expected) => {
    expect(
      buildNotificationHref(
        row({ kind, context_type: contextType, payload: { url: "/stale/url" } }),
      ),
    ).toBe(expected);
  });

  it("falls back to a relative payload url for system notifications", () => {
    expect(
      buildNotificationHref(
        row({
          kind: "system",
          context_type: null,
          context_id: null,
          payload: { url: ROUTES.profil },
        }),
      ),
    ).toBe(ROUTES.profil);
  });

  it("rejects absolute payload urls (no open redirect)", () => {
    expect(
      buildNotificationHref(
        row({
          kind: "system",
          context_type: null,
          context_id: null,
          payload: { url: "https://evil.example/phish" },
        }),
      ),
    ).toBeNull();
  });

  it("returns null when the row is not navigable", () => {
    expect(buildNotificationHref(row({ context_status: "deleted" }))).toBeNull();
    expect(buildNotificationHref(row({ context_status: "finished" }))).toBeNull();
  });
});

describe("getNotificationVisual", () => {
  it("reuses CONTENT_TYPE_TAGS for content-bound kinds", () => {
    const visual = getNotificationVisual({ kind: "nudge", context_type: "event" });
    expect(visual.icon).toBe(CONTENT_TYPE_TAGS.event.icon);
    expect(visual.className).toBe(CONTENT_TYPE_TAGS.event.className);
  });

  it("uses the system visual when no content is attached", () => {
    const visual = getNotificationVisual({ kind: "system", context_type: null });
    expect(visual.className).toContain("purple");
  });
});
