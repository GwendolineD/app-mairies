import { describe, expect, it } from "vitest";
import {
  getNotificationGroup,
  groupNotifications,
} from "@/lib/utils/notification-grouping";
import type { NotificationItem } from "@/lib/types";

// Wednesday 2026-10-07 15:00 Paris (UTC+2) — mid-week reference instant.
const NOW = "2026-10-07T13:00:00.000Z";

function item(id: string, createdAt: string): NotificationItem {
  return {
    id,
    kind: "system",
    tag: null,
    title: null,
    body: null,
    payload: {},
    context_type: null,
    context_id: null,
    read_at: null,
    created_at: createdAt,
    context_status: "available",
    is_author: false,
  };
}

describe("getNotificationGroup", () => {
  it("buckets the same Paris day as today, even across the UTC midnight", () => {
    // 00:30 Paris on the 7th = 22:30 UTC on the 6th.
    expect(getNotificationGroup("2026-10-06T22:30:00.000Z", NOW)).toBe("today");
  });

  it("buckets yesterday (same week) as this week", () => {
    expect(getNotificationGroup("2026-10-06T10:00:00.000Z", NOW)).toBe("week");
  });

  it("buckets Monday 00:00 Paris as this week and Sunday before as older", () => {
    // Monday 2026-10-05 00:00 Paris = 2026-10-04T22:00Z
    expect(getNotificationGroup("2026-10-04T22:00:00.000Z", NOW)).toBe("week");
    expect(getNotificationGroup("2026-10-04T21:59:59.000Z", NOW)).toBe("older");
  });
});

describe("groupNotifications", () => {
  it("keeps group order and drops empty groups", () => {
    const groups = groupNotifications(
      [
        item("a", "2026-10-07T08:00:00.000Z"),
        item("b", "2026-09-20T08:00:00.000Z"),
      ],
      NOW,
    );
    expect(groups.map((g) => g.key)).toEqual(["today", "older"]);
    expect(groups[0].items.map((i) => i.id)).toEqual(["a"]);
    expect(groups[1].label).toBe("Plus ancien");
  });
});
