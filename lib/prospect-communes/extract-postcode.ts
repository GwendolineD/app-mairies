const POSTCODE_RE = /\b(\d{5})\b/;

/** Extract the first 5-digit French postcode from a mairie address string. */
export function extractPostcode(address: string | null | undefined): string | null {
  if (!address?.trim()) return null;
  const match = address.match(POSTCODE_RE);
  return match?.[1] ?? null;
}
