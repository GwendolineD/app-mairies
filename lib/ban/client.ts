const BAN_BASE =
  process.env.NEXT_PUBLIC_BAN_API_URL ?? "https://api-adresse.data.gouv.fr";

/**
 * Municipality lookups use geo.api.gouv.fr: the BAN `/search/?type=municipality`
 * endpoint scores whole addresses and misses partial commune names
 * (e.g. "auth" never surfaces "Les Authieux").
 */
const GEO_BASE = process.env.NEXT_PUBLIC_GEO_API_URL ?? "https://geo.api.gouv.fr";

export type BanFeature = {
  label: string;
  citycode: string;
  city: string;
  postcode: string;
  name: string;
  type: string;
  score: number;
  lat: number;
  lng: number;
};

type BanResponse = {
  features: Array<{
    geometry: { coordinates: [number, number] };
    properties: {
      label: string;
      citycode: string;
      city: string;
      postcode: string;
      name: string;
      type: string;
      score: number;
    };
  }>;
};

function mapFeature(f: BanResponse["features"][0]): BanFeature {
  const [lng, lat] = f.geometry.coordinates;
  return {
    label: f.properties.label,
    citycode: f.properties.citycode,
    city: f.properties.city,
    postcode: f.properties.postcode,
    name: f.properties.name,
    type: f.properties.type,
    score: f.properties.score,
    lat,
    lng,
  };
}

type GeoCommune = {
  nom: string;
  code: string;
  codesPostaux?: string[];
  centre?: { coordinates: [number, number] };
  _score?: number;
};

function mapGeoCommune(commune: GeoCommune, preferredPostcode?: string): BanFeature {
  const [lng, lat] = commune.centre?.coordinates ?? [0, 0];
  const postcodes = commune.codesPostaux ?? [];
  const postcode =
    preferredPostcode && postcodes.includes(preferredPostcode)
      ? preferredPostcode
      : (postcodes[0] ?? "");
  return {
    label: commune.nom,
    citycode: commune.code,
    city: commune.nom,
    postcode,
    name: commune.nom,
    type: "municipality",
    score: commune._score ?? 0,
    lat,
    lng,
  };
}

export async function searchMunicipalities(
  query: string,
  limit = 15,
): Promise<BanFeature[]> {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];
  if (!/^[a-zA-Z0-9\u00C0-\u024F]/.test(trimmed)) return [];

  const isPostcode = /^\d{5}$/.test(trimmed);
  const params = new URLSearchParams({
    fields: "nom,code,codesPostaux,centre",
    format: "json",
    geometry: "centre",
    limit: String(limit),
  });
  if (isPostcode) {
    params.set("codePostal", trimmed);
  } else {
    // No population boost: the product targets small communes, which would be
    // pushed out of the results by larger cities sharing the same prefix.
    params.set("nom", trimmed);
  }

  const res = await fetch(`${GEO_BASE}/communes?${params}`);
  if (!res.ok) return [];
  const data = (await res.json()) as GeoCommune[];
  return data.map((commune) =>
    mapGeoCommune(commune, isPostcode ? trimmed : undefined),
  );
}

/** Resolve coordinates for a street within a municipality (server or client). */
export async function resolveAddressCoordinates(
  street: string,
  citycode: string,
): Promise<BanFeature | null> {
  const features = await searchAddresses(street, citycode, 1);
  return features[0] ?? null;
}

export async function searchAddresses(
  query: string,
  citycode?: string,
  limit = 8,
): Promise<BanFeature[]> {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];
  if (!/^[a-zA-Z0-9\u00C0-\u024F]/.test(trimmed)) return [];
  const params = new URLSearchParams({
    q: trimmed,
    limit: String(limit),
  });
  if (citycode?.trim()) {
    params.set("citycode", citycode.trim());
  }
  const res = await fetch(`${BAN_BASE}/search/?${params}`);
  if (!res.ok) return [];
  const data = (await res.json()) as BanResponse;
  return data.features.map(mapFeature);
}
