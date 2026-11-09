import { describe, expect, it } from "vitest";
import {
  applyServerUnreadCount,
  clickUnreadNotification,
  confirmUnreadNotification,
  initialUnreadBadgeState,
  markAllUnreadNotificationsRead,
  undoUnreadNotification,
  type UnreadBadgeState,
} from "@/lib/utils/unread-notifications-badge";

const COMMUNE_A = "commune-a";
const COMMUNE_B = "commune-b";

function synced(count: number, communeId = COMMUNE_A): UnreadBadgeState {
  return applyServerUnreadCount(initialUnreadBadgeState(), count, communeId);
}

function ids(state: UnreadBadgeState): string[] {
  return [...state.inFlight].sort();
}

describe("unread notification badge", () => {
  it("starts from the server total", () => {
    const state = synced(2);
    expect(state.displayed).toBe(2);
    expect(ids(state)).toEqual([]);
  });

  it("lowers the count by one on click", () => {
    const state = clickUnreadNotification(synced(2), "n1");
    expect(state.displayed).toBe(1);
    expect(ids(state)).toEqual(["n1"]);
  });

  it("ignores a second click on the same id", () => {
    const once = clickUnreadNotification(synced(2), "n1");
    const twice = clickUnreadNotification(once, "n1");
    expect(twice).toBe(once);
    expect(twice.displayed).toBe(1);
  });

  it("gives the count back when the write fails", () => {
    const clicked = clickUnreadNotification(synced(2), "n1");
    const undone = undoUnreadNotification(clicked, "n1");
    expect(undone.displayed).toBe(2);
    expect(ids(undone)).toEqual([]);
  });

  it("ignores a stale server total while a click is in flight", () => {
    const clicked = clickUnreadNotification(synced(2), "n1");
    const stale = applyServerUnreadCount(clicked, 2, COMMUNE_A);
    expect(stale).toBe(clicked);
    expect(stale.displayed).toBe(1);
  });

  it("keeps the local count when the write succeeds", () => {
    const clicked = clickUnreadNotification(synced(2), "n1");
    const confirmed = confirmUnreadNotification(clicked, "n1");
    expect(confirmed.displayed).toBe(1);
    expect(ids(confirmed)).toEqual([]);
  });

  it("adopts the confirmed server total once the write has finished", () => {
    const clicked = clickUnreadNotification(synced(2), "n1");
    const confirmed = confirmUnreadNotification(clicked, "n1");
    const next = applyServerUnreadCount(confirmed, 1, COMMUNE_A);
    expect(next.displayed).toBe(1);
    expect(ids(next)).toEqual([]);
  });

  it("adopts a new notification that offsets the read, once the write has finished", () => {
    const clicked = clickUnreadNotification(synced(2), "n1");
    const confirmed = confirmUnreadNotification(clicked, "n1");
    // One read confirmed and one new notification: the server total stays at 2.
    const next = applyServerUnreadCount(confirmed, 2, COMMUNE_A);
    expect(next.displayed).toBe(2);
  });

  it("takes the new total immediately when the commune changes, even mid-click", () => {
    const clicked = clickUnreadNotification(synced(2), "n1");
    const switched = applyServerUnreadCount(clicked, 5, COMMUNE_B);
    expect(switched.displayed).toBe(5);
    expect(switched.communeId).toBe(COMMUNE_B);
    expect(ids(switched)).toEqual([]);
  });

  it("drops the badge to zero on mark-all and clears in-flight clicks", () => {
    const clicked = clickUnreadNotification(synced(3), "n1");
    const cleared = markAllUnreadNotificationsRead(clicked);
    expect(cleared.displayed).toBe(0);
    expect(ids(cleared)).toEqual([]);
  });
});
