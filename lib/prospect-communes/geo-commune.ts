const GEO_BASE = process.env.NEXT_PUBLIC_GEO_API_URL ?? "https://geo.api.gouv.fr";

export type GeoCommuneDetail = {
  code: string;
  nom: string;
  codeDepartement: string;
  population?: number;
  centre?: { coordinates: [number, number] };
};

type GeoCommuneSearchResult = {
  nom: string;
  code: string;
  centre?: { coordinates: [number, number] };
};

/** Fetch commune metadata by INSEE code (authoritative server-side source). */
export async function fetchGeoCommuneByInsee(
  inseeCode: string,
): Promise<GeoCommuneDetail | null> {
  const trimmed = inseeCode.trim();
  if (!trimmed) return null;

  const params = new URLSearchParams({
    fields: "code,nom,codeDepartement,population,centre",
    format: "json",
    geometry: "centre",
  });
  const res = await fetch(
    `${GEO_BASE}/communes/${encodeURIComponent(trimmed)}?${params}`,
    { cache: "no-store" },
  );
  if (!res.ok) return null;
  return res.json() as Promise<GeoCommuneDetail>;
}

/** Resolve INSEE code from commune name + department (import script). */
export async function fetchGeoCommuneByName(
  commune: string,
  departement: string,
): Promise<GeoCommuneSearchResult | null> {
  const params = new URLSearchParams({
    nom: commune,
    codeDepartement: departement,
    fields: "nom,code,centre",
    format: "json",
    geometry: "centre",
    limit: "5",
  });
  const res = await fetch(`${GEO_BASE}/communes?${params}`, { cache: "no-store" });
  if (!res.ok) return null;
  const data = (await res.json()) as GeoCommuneSearchResult[];
  const exact =
    data.find((entry) => entry.nom.toLowerCase() === commune.toLowerCase()) ??
    data[0];
  return exact ?? null;
}

/** Client-side UX preview — same geo endpoint, no caching. */
export async function fetchGeoCommunePreview(
  inseeCode: string,
): Promise<GeoCommuneDetail | null> {
  return fetchGeoCommuneByInsee(inseeCode);
}
