const EUR = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const EUR_PRECISE = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Formats an integer amount of cents as a EUR string (no decimals). */
export function formatCents(cents: number | null | undefined): string {
  return EUR.format(Math.round((cents ?? 0) / 100));
}

/** Formats an integer amount of cents as a EUR string with 2 decimals. */
export function formatCentsPrecise(cents: number | null | undefined): string {
  return EUR_PRECISE.format((cents ?? 0) / 100);
}

/** Parses a user-entered euro amount (e.g. "49" or "49,90") into cents. */
export function parseEurosToCents(raw: string): number | null {
  const normalized = raw.trim().replace(/\s/g, "").replace(",", ".");
  if (normalized === "") return null;
  const value = Number(normalized);
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 100);
}
