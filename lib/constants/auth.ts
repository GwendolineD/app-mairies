import { ROUTES } from "@/lib/constants/routes";

export const RECOVERY_COOKIE_NAME = "vl_recovery";
export const RECOVERY_COOKIE_MAX_AGE = 3600;

export const GUEST_ONLY_AUTH_PATHS = [
  ROUTES.connexion,
  ROUTES.connexionForgotPassword,
  ROUTES.inscription.root,
] as const;

export function isGuestOnlyAuthPath(pathname: string): boolean {
  return (GUEST_ONLY_AUTH_PATHS as readonly string[]).includes(pathname);
}
