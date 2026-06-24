import { searchAddresses } from "@/lib/ban/client";
import { formatStreetDisplay } from "@/lib/ban/display";

export type ProfileAddressState = {
  street: string;
  city: string;
  postcode: string;
  lat: number;
  lng: number;
};

export function hasValidCoords(lat: number, lng: number) {
  return Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0;
}

export function buildInitialAddress(
  addressStreet: string | null,
  addressPostcode: string | null,
  addressCity: string | null,
  addressLat: number | null,
  addressLng: number | null,
): ProfileAddressState {
  return {
    street: addressStreet ?? "",
    city: addressCity ?? "",
    postcode: addressPostcode ?? "",
    lat: addressLat ?? 0,
    lng: addressLng ?? 0,
  };
}

export async function resolveCoordsFromBan(
  street: string,
  postcode: string,
  city: string,
  citycode: string,
): Promise<{ lat: number; lng: number } | null> {
  const query = [street, postcode, city].filter(Boolean).join(" ").trim();
  if (query.length < 3) return null;

  const results = await searchAddresses(query, citycode, 5);
  if (!results.length) return null;

  const normalizedStreet = street.trim().toLowerCase();
  const match =
    results.find((feature) =>
      formatStreetDisplay(feature.label).toLowerCase().includes(normalizedStreet),
    ) ?? results[0];

  return { lat: match.lat, lng: match.lng };
}

export function slugifyProfileName(first: string | null, last: string | null) {
  return [first, last]
    .filter(Boolean)
    .join("-")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase()
    .slice(0, 60);
}
