export type AddressLines = {
  streetLine: string | null;
  cityLine: string | null;
  fallback: string | null;
};

const FR_POSTCODE_PATTERN = /\b(\d{5})\b/;

/** Resolve a French postcode from an explicit value or embedded address strings. */
export function resolveAddressPostcode(
  primary: string | null | undefined,
  ...fallbackSources: (string | null | undefined)[]
): string | null {
  const trimmed = primary?.trim();
  if (trimmed && trimmed.length >= 4) return trimmed;

  for (const source of fallbackSources) {
    const text = source?.trim();
    if (!text) continue;
    const match = text.match(FR_POSTCODE_PATTERN);
    if (match) return match[1];
  }

  return null;
}

/** Street on line 1, postcode + city on line 2. */
export function formatAddressLines(
  street: string | null | undefined,
  postcode: string | null | undefined,
  city: string | null | undefined,
  fallback = "Adresse non renseignée",
): AddressLines {
  const streetLine = street?.trim() || null;
  const cityLine = [postcode?.trim(), city?.trim()].filter(Boolean).join(" ") || null;

  if (!streetLine && !cityLine) {
    return { streetLine: null, cityLine: null, fallback };
  }

  return { streetLine, cityLine, fallback: null };
}

/** Single-line label (legacy / compact contexts). */
export function formatAddressLabel(
  street: string | null | undefined,
  postcode: string | null | undefined,
  city: string | null | undefined,
  fallback = "Adresse non renseignée",
): string {
  const { streetLine, cityLine, fallback: fb } = formatAddressLines(
    street,
    postcode,
    city,
    fallback,
  );
  if (fb) return fb;
  if (streetLine && cityLine) return `${streetLine}, ${cityLine}`;
  return streetLine ?? cityLine ?? fallback;
}
