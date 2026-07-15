import { ROUTES } from "@/lib/constants/routes";

export function getAppUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

/** Profile settings tab — used in email templates (footer + notification CTA). */
export function profileSettingsUrl(): string {
  return `${getAppUrl()}${ROUTES.profil}?tab=parametres`;
}
