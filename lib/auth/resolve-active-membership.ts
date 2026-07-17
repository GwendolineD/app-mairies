import type { Membership } from "@/lib/types";

export type ActiveMembershipResolution = {
  activeMembership: Membership | null;
  isSuspendedForActiveCommune: boolean;
  resolvedCommuneId: string | null;
};

/**
 * Pure resolution of the active membership from a user's membership list.
 *
 * Preserves the historical fallback (first active membership) for every case
 * except when the stored `activeCommuneId` points to a suspended membership:
 * there we still fall back to another active commune when one exists, and only
 * flag `isSuspendedForActiveCommune` when no active commune remains.
 */
export function resolveActiveMembership(
  list: Membership[],
  activeCommuneId: string | null,
): ActiveMembershipResolution {
  const directMatch = list.find(
    (m) => m.commune_id === activeCommuneId && m.status === "active",
  );
  const suspendedOnActive =
    !!activeCommuneId &&
    list.some(
      (m) => m.commune_id === activeCommuneId && m.status === "suspended",
    );

  const activeMembership =
    directMatch ?? list.find((m) => m.status === "active") ?? null;

  return {
    activeMembership,
    isSuspendedForActiveCommune: suspendedOnActive && !activeMembership,
    resolvedCommuneId: activeMembership?.commune_id ?? activeCommuneId,
  };
}
