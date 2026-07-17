import { describe, expect, it } from "vitest";
import type { Membership, MembershipStatus } from "@/lib/types";
import { resolveActiveMembership } from "@/lib/auth/resolve-active-membership";

function makeMembership(
  communeId: string,
  status: MembershipStatus,
): Membership {
  return {
    id: `membership-${communeId}`,
    user_id: "user-1",
    commune_id: communeId,
    address_street: null,
    address_lieu_dit: null,
    address_city: null,
    address_citycode: null,
    address_postcode: null,
    address_lat: null,
    address_lng: null,
    role: "member",
    is_primary: false,
    status,
    suspended_at: status === "suspended" ? "2026-01-01T00:00:00Z" : null,
    suspension_reason: null,
    total_announcements_published: 0,
    total_initiatives_published: 0,
    total_events_published: 0,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  };
}

describe("resolveActiveMembership", () => {
  it("returns the direct match when active_commune_id points to an active membership", () => {
    const list = [
      makeMembership("A", "active"),
      makeMembership("B", "active"),
    ];
    const result = resolveActiveMembership(list, "A");

    expect(result.activeMembership?.commune_id).toBe("A");
    expect(result.isSuspendedForActiveCommune).toBe(false);
    expect(result.resolvedCommuneId).toBe("A");
  });

  it("falls back to an active membership when active_commune_id is null", () => {
    const list = [makeMembership("B", "active")];
    const result = resolveActiveMembership(list, null);

    expect(result.activeMembership?.commune_id).toBe("B");
    expect(result.isSuspendedForActiveCommune).toBe(false);
    expect(result.resolvedCommuneId).toBe("B");
  });

  it("falls back when active_commune_id points to a left membership not in the list", () => {
    const list = [makeMembership("B", "active")];
    const result = resolveActiveMembership(list, "A");

    expect(result.activeMembership?.commune_id).toBe("B");
    expect(result.isSuspendedForActiveCommune).toBe(false);
    expect(result.resolvedCommuneId).toBe("B");
  });

  it("falls back to another active commune when the active commune is suspended", () => {
    const list = [
      makeMembership("A", "suspended"),
      makeMembership("B", "active"),
    ];
    const result = resolveActiveMembership(list, "A");

    expect(result.activeMembership?.commune_id).toBe("B");
    expect(result.isSuspendedForActiveCommune).toBe(false);
    expect(result.resolvedCommuneId).toBe("B");
  });

  it("flags suspension when the active commune is suspended and no other active commune exists", () => {
    const list = [makeMembership("A", "suspended")];
    const result = resolveActiveMembership(list, "A");

    expect(result.activeMembership).toBeNull();
    expect(result.isSuspendedForActiveCommune).toBe(true);
    expect(result.resolvedCommuneId).toBe("A");
  });

  it("returns no active membership when the list is empty", () => {
    const result = resolveActiveMembership([], null);

    expect(result.activeMembership).toBeNull();
    expect(result.isSuspendedForActiveCommune).toBe(false);
    expect(result.resolvedCommuneId).toBeNull();
  });
});
