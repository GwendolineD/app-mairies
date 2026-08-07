import { ROUTES } from "@/lib/constants/routes";
import { CONTEXT_TYPE_LABELS } from "@/lib/constants/context-types";
import type { ConversationContextType } from "@/lib/types";

export { CONTEXT_TYPE_LABELS as CONTEXT_LABEL };

/** Link back to the announcement / initiative / event a thread is attached to. */
export function contextHref(
  type: ConversationContextType | null,
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
