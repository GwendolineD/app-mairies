import { CONTENT_TYPE_TAGS } from "@/lib/constants/content-types";
import type { ConversationContextType } from "@/lib/types";

/** Labels derived from `CONTENT_TYPE_TAGS` (single source of truth). */
export const CONTEXT_TYPE_LABELS: Record<ConversationContextType, string> = {
  announcement: CONTENT_TYPE_TAGS.announcement.label,
  initiative: CONTENT_TYPE_TAGS.initiative.label,
  event: CONTENT_TYPE_TAGS.event.label,
};
