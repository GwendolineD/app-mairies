import { ROUTES } from "@/lib/constants/routes";
import type { ContextType } from "@/lib/types";

export const CONTEXT_LABEL: Record<ContextType, string> = {
  announcement: "Annonce",
  initiative: "Initiative",
  event: "Événement",
};

/** Link back to the announcement / initiative / event a thread is attached to. */
export function contextHref(
  type: ContextType | null,
  id: string | null,
): string | null {
  if (!type || !id) return null;
  switch (type) {
    case "announcement":
      return ROUTES.annonces.detail(id);
    case "initiative":
      return ROUTES.initiatives.detail(id);
    case "event":
      return ROUTES.evenements.detail(id);
    default:
      return null;
  }
}
