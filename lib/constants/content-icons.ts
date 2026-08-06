import {
  CalendarDays,
  Heart,
  HeartHandshake,
  MapPin,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";

export type { LucideIcon };

/** Single source of truth for semantic content block icons (sidebars, modals, CTAs). */
export const CONTENT_ICONS = {
  // Events
  eventVolunteers: HeartHandshake,
  eventParticipants: Users,
  eventManage: CalendarDays,

  // Initiatives
  initiativeSupport: Heart,
  initiativeManage: Sparkles,

  // Shared
  location: MapPin,
} as const satisfies Record<string, LucideIcon>;
