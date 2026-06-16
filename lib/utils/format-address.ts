export type AddressLines = {
  streetLine: string | null;
  cityLine: string | null;
  fallback: string | null;
};

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
