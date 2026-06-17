import type { MembershipRole } from "@/lib/types";

export const MEMBERSHIP_ROLES = {
  member: "member",
  staff: "staff",
  mayor: "mayor",
} as const satisfies Record<string, MembershipRole>;

export const COMMUNE_STAFF_ROLES: MembershipRole[] = [
  MEMBERSHIP_ROLES.staff,
  MEMBERSHIP_ROLES.mayor,
];
