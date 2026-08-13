import type { OpeningDay } from "@/lib/prospect-communes/types";

const DAY_NAMES: OpeningDay[] = [
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
];

const DAY_PATTERN = /Lundi|Mardi|Mercredi|Jeudi|Vendredi|Samedi/g;

/**
 * Parse opening days from free-text horaires (e.g. "Mardi: 17:00-18:30 | Vendredi: …").
 */
export function parseOpeningDays(
  horaires: string | null | undefined,
): OpeningDay[] {
  if (!horaires?.trim()) return [];

  const found = new Set<OpeningDay>();
  for (const match of horaires.matchAll(DAY_PATTERN)) {
    const day = match[0] as OpeningDay;
    if (DAY_NAMES.includes(day)) {
      found.add(day);
    }
  }

  return DAY_NAMES.filter((day) => found.has(day));
}
