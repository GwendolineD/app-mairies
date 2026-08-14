/** Short display for horaires on list cards and map popups. */
export function formatHorairesDisplay(
  horaires: string | null | undefined,
): string {
  if (!horaires?.trim()) return "Horaires non renseignés";
  const normalized = horaires.trim().replace(/\s*\|\s*/g, " · ");
  return normalized.length > 120 ? `${normalized.slice(0, 117)}…` : normalized;
}

/** One line per opening slot for PDF export (split on middle dot separators). */
export function formatHorairesPdfLines(
  horaires: string | null | undefined,
): string[] {
  if (!horaires?.trim()) return [];
  return horaires
    .trim()
    .replace(/\s*\|\s*/g, " · ")
    .split(/\s·\s/)
    .map((line) => line.trim())
    .filter(Boolean);
}
