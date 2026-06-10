import type { BanFeature } from "@/lib/ban/client";

/** Extracts street line from a BAN address label (strips postcode + city tail). */
export function formatStreetDisplay(addressLabel: string | null | undefined): string {
  if (!addressLabel?.trim()) return "Adresse non renseignée";
  const normalized = addressLabel.trim().replace(/\s*,\s*/g, " ");
  const street = normalized.replace(/\s+\d{5}(?:\s+.+)?$/, "").trim();
  return street || addressLabel.trim();
}

export function formatMunicipalityDisplay(feature: BanFeature): string {
  const city = feature.city?.trim() || feature.name?.trim();
  const postcode = feature.postcode?.trim();
  if (!city) return feature.label;
  return postcode ? `${city} (${postcode})` : city;
}
