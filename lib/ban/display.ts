import type { BanFeature } from "@/lib/ban/client";

/** Extracts street line from a BAN address label (no neighbourhood/quartier). */
export function formatStreetDisplay(addressLabel: string | null | undefined): string {
  if (!addressLabel?.trim()) return "Adresse non renseignée";
  const parts = addressLabel.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return addressLabel.trim();
  return parts[0];
}

export function formatMunicipalityDisplay(feature: BanFeature): string {
  const city = feature.city?.trim() || feature.name?.trim();
  const postcode = feature.postcode?.trim();
  if (!city) return feature.label;
  return postcode ? `${city} (${postcode})` : city;
}
