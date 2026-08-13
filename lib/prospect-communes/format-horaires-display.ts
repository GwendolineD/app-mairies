/** Short display for horaires on list cards and map popups. */
export function formatHorairesDisplay(
  horaires: string | null | undefined,
): string {
  if (!horaires?.trim()) return "Horaires non renseignés";
  const normalized = horaires.trim().replace(/\s*\|\s*/g, " · ");
  return normalized.length > 120 ? `${normalized.slice(0, 117)}…` : normalized;
}
