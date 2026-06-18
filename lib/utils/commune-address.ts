import type { Commune, MembershipAddress } from "@/lib/types";

type CommuneAddressSource = Pick<
  Commune,
  | "name"
  | "postcode"
  | "insee_code"
  | "centroid_lat"
  | "centroid_lng"
  | "mairie_address_street"
  | "mairie_address_city"
  | "mairie_address_postcode"
  | "mairie_address_lat"
  | "mairie_address_lng"
  | "settings"
>;

/** Default event location for municipality admin (commune HQ, not staff home). */
export function communeToDefaultAddress(
  commune: CommuneAddressSource,
): MembershipAddress {
  const street =
    commune.mairie_address_street?.trim() ||
    commune.settings?.address?.trim() ||
    "Mairie";

  return {
    street,
    city: commune.mairie_address_city?.trim() || commune.name?.trim() || null,
    citycode: commune.insee_code?.trim() || null,
    postcode:
      commune.mairie_address_postcode?.trim() ||
      commune.postcode?.trim() ||
      null,
    lat: commune.mairie_address_lat ?? commune.centroid_lat,
    lng: commune.mairie_address_lng ?? commune.centroid_lng,
  };
}
