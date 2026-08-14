const RECHERCHE_ENTREPRISES_BASE =
  "https://recherche-entreprises.api.gouv.fr/search";

const FETCH_TIMEOUT_MS = 15_000;

async function fetchWithTimeout(
  url: string,
  init?: RequestInit,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export type ProspectAssociationEnrichmentResult = {
  associationCount?: number;
  associationLabel?: string;
  errors: string[];
};

export async function fetchAssociationCountFromRechercheEntreprises(
  inseeCode: string,
): Promise<{ count: number; label: string }> {
  const params = new URLSearchParams({
    code_commune: inseeCode,
    est_association: "true",
    page: "1",
    per_page: "1",
  });

  const response = await fetchWithTimeout(
    `${RECHERCHE_ENTREPRISES_BASE}?${params.toString()}`,
    { headers: { Accept: "application/json" } },
  );

  if (!response.ok) {
    throw new Error(
      `API associations indisponible (${response.status}).`,
    );
  }

  const payload = (await response.json()) as { total_results?: number };
  const count = payload.total_results ?? 0;

  return {
    count,
    label: `${count.toLocaleString("fr-FR")} association${count > 1 ? "s" : ""} recensée${count > 1 ? "s" : ""} (API Recherche Entreprises, commune ${inseeCode})`,
  };
}

export async function fetchProspectAssociationEnrichment(
  inseeCode: string,
): Promise<ProspectAssociationEnrichmentResult> {
  const errors: string[] = [];

  try {
    const associations =
      await fetchAssociationCountFromRechercheEntreprises(inseeCode);
    return {
      associationCount: associations.count,
      associationLabel: associations.label,
      errors,
    };
  } catch (error) {
    errors.push(
      error instanceof Error ? error.message : "Erreur associations inconnue.",
    );
    return { errors };
  }
}
