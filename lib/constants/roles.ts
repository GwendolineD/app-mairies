import type { UserRole } from "@/lib/types";

export const USER_ROLES = {
  resident: "resident",
  municipalityStaff: "municipality_staff",
  platformAdmin: "platform_admin",
} as const satisfies Record<string, UserRole>;

export type StaffRole =
  | typeof USER_ROLES.municipalityStaff
  | typeof USER_ROLES.platformAdmin;

export const STAFF_ROLES: StaffRole[] = [
  USER_ROLES.municipalityStaff,
  USER_ROLES.platformAdmin,
];
