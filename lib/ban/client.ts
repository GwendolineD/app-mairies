const BAN_BASE =
  process.env.NEXT_PUBLIC_BAN_API_URL ?? "https://api-adresse.data.gouv.fr";

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

export async function searchMunicipalities(
  query: string,
  limit = 8,
): Promise<BanFeature[]> {
  if (query.trim().length < 2) return [];
  const params = new URLSearchParams({
    q: query,
    type: "municipality",
    limit: String(limit),
  });
  const res = await fetch(`${BAN_BASE}/search/?${params}`);
  if (!res.ok) return [];
  const data = (await res.json()) as BanResponse;
  return data.features.map(mapFeature);
}

export async function searchAddresses(
  query: string,
  citycode: string,
  limit = 8,
): Promise<BanFeature[]> {
  if (query.trim().length < 3) return [];
  const params = new URLSearchParams({
    q: query,
    citycode,
    limit: String(limit),
  });
  const res = await fetch(`${BAN_BASE}/search/?${params}`);
  if (!res.ok) return [];
  const data = (await res.json()) as BanResponse;
  return data.features.map(mapFeature);
}
