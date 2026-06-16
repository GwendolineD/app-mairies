import type { SessionContext } from "@/lib/auth/session";
import { COMMUNE_STAFF_ROLES } from "@/lib/constants/roles";
import { RESIDENT_BACKOFFICE_NAV } from "@/lib/constants/routes";
import type { MembershipRole } from "@/lib/types";

export type BackofficeNavLink = {
  href: string;
  label: string;
  id: "mairie" | "backoffice";
};

/**
 * Mirrors requireCommuneStaff() visibility rules — UX only, not a security boundary.
 */
export function canAccessCommuneStaff(ctx: SessionContext): boolean {
  if (ctx.profile.is_platform_admin && ctx.activeCommuneId) {
    return true;
  }

  const m = ctx.activeMembership;
  return (
    !!m &&
    (COMMUNE_STAFF_ROLES as readonly MembershipRole[]).includes(m.role)
  );
}

/**
 * Mirrors requirePlatformAdmin() visibility rules — UX only, not a security boundary.
 */
export function canAccessPlatformAdmin(ctx: SessionContext): boolean {
  return ctx.profile.is_platform_admin;
}

export function getResidentBackofficeNav(
  ctx: SessionContext,
): BackofficeNavLink[] {
  const items: BackofficeNavLink[] = [];

  if (canAccessCommuneStaff(ctx)) {
    items.push(RESIDENT_BACKOFFICE_NAV.mairie);
  }

  if (canAccessPlatformAdmin(ctx)) {
    items.push(RESIDENT_BACKOFFICE_NAV.backoffice);
  }

  return items;
}
