import { CalendarDays, Megaphone, Sparkles, type LucideIcon } from "lucide-react";
import { INITIATIVE_VOCAB } from "@/lib/constants/content-vocabulary";
import type { ConversationContextType } from "@/lib/types";

/**
 * Single source of truth for the visual identity of a content type
 * (label, pastel tag colors, icon). Used by content tags, the messages inbox
 * and the notification center — never redefine these per feature.
 */
export const CONTENT_TYPE_TAGS: Record<
  ConversationContextType,
  { label: string; className: string; icon: LucideIcon }
> = {
  announcement: {
    label: "Annonce",
    className: "bg-purple/10 text-purple",
    icon: Megaphone,
  },
  event: {
    label: "Événement",
    className: "bg-orange/10 text-orange",
    icon: CalendarDays,
  },
  initiative: {
    label: INITIATIVE_VOCAB.tag,
    className: "bg-mint/10 text-mint",
    icon: Sparkles,
  },
};

export type ContentTypeTagKey = keyof typeof CONTENT_TYPE_TAGS;
