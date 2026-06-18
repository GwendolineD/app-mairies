// @ts-nocheck
import type { ParticipantProfile } from "@/lib/types";

/** Best display label for a participant, with a neutral inclusive fallback. */
export function participantName(profile: ParticipantProfile | null): string {
  if (!profile) return "Voisin·e";
  const full = [profile.first_name, profile.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  return profile.display_name?.trim() || full || "Voisin·e";
}

/** Up to two-letter initials used for the avatar fallback. */
export function participantInitials(profile: ParticipantProfile | null): string {
  const name = participantName(profile);
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
