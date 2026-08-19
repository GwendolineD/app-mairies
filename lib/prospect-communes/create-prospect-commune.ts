/** Pure helpers for prospect commune creation — testable without Supabase. */

export function resolveProspectPopulation(
  geoPopulation: number | null | undefined,
  populationFallback: number | undefined,
): { population: number } | { error: string } {
  if (typeof geoPopulation === "number" && Number.isFinite(geoPopulation)) {
    return { population: Math.max(0, Math.trunc(geoPopulation)) };
  }

  if (populationFallback !== undefined) {
    return { population: populationFallback };
  }

  return { error: "Population requise — saisissez-la manuellement." };
}

export function isUniqueViolation(error: { code?: string } | null): boolean {
  return error?.code === "23505";
}
