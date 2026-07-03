export function formatShortDate(value: string | null | undefined): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

/** Short date with time, e.g. "03 juil. 2026 · 14h30". */
export function formatShortDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  const datePart = formatShortDate(value);
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${datePart} · ${hours}h${minutes}`;
}

/** Short date with 2-digit year, e.g. "25 juin 26". */
export function formatCompactShortDate(
  value: string | null | undefined,
): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  }).format(new Date(value));
}
