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

/** Build a single-line address label with postcode before city. */
export function buildAddressLabel(
  street: string | null | undefined,
  postcode: string | null | undefined,
  city: string | null | undefined,
): string | null {
  const streetLine = street?.trim() || null;
  const cityLine = [postcode?.trim(), city?.trim()].filter(Boolean).join(" ") || null;

  if (!streetLine && !cityLine) return null;
  if (!streetLine) return cityLine;
  if (!cityLine) return streetLine;
  return `${streetLine}, ${cityLine}`;
}

/** Split legacy "street, postcode city" or "street, city" labels. */
export function parseAddressLabelParts(addressLabel: string): {
  street: string | null;
  postcode: string | null;
  city: string | null;
} {
  const parts = addressLabel.split(",").map((part) => part.trim()).filter(Boolean);
  if (parts.length === 0) {
    return { street: null, postcode: null, city: null };
  }
  if (parts.length === 1) {
    return { street: parts[0], postcode: null, city: null };
  }

  const street = parts[0];
  const cityPart = parts.slice(1).join(", ");
  const postcode = cityPart.match(FR_POSTCODE_PATTERN)?.[1] ?? null;
  const city = postcode
    ? cityPart.replace(FR_POSTCODE_PATTERN, "").trim() || null
    : cityPart || null;

  return { street, postcode, city };
}

/** Detail pages: structured fields or legacy address_label with optional postcode fallback. */
export function formatDetailAddressLines(options: {
  street?: string | null;
  postcode?: string | null;
  city?: string | null;
  addressLabel?: string | null;
  fallbackPostcode?: string | null;
}): AddressLines {
  if (options.street?.trim() || options.city?.trim()) {
    const postcode = resolveAddressPostcode(
      options.postcode,
      options.addressLabel,
      options.fallbackPostcode,
    );
    return formatAddressLines(options.street, postcode, options.city);
  }

  if (options.addressLabel?.trim()) {
    const parsed = parseAddressLabelParts(options.addressLabel.trim());
    const postcode = resolveAddressPostcode(
      parsed.postcode,
      options.addressLabel,
      options.fallbackPostcode,
    );
    return formatAddressLines(parsed.street, postcode, parsed.city);
  }

  return formatAddressLines(null, null, null);
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
