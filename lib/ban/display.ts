import type { BanFeature } from "@/lib/ban/client";

export function formatMunicipalityDisplay(feature: BanFeature): string {
  const city = feature.city?.trim() || feature.name?.trim();
  const postcode = feature.postcode?.trim();
  if (!city) return feature.label;
  return postcode ? `${city} (${postcode})` : city;
}
