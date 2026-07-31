import type { PopulationBracket } from "@/lib/queries/backoffice-users-list.types";

export function countByCommuneId(
  rows: { commune_id: string }[],
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const row of rows) {
    counts.set(row.commune_id, (counts.get(row.commune_id) ?? 0) + 1);
  }
  return counts;
}

export function resolvePopulationBracket(population: number): PopulationBracket {
  if (population <= 500) return "0-500";
  if (population <= 800) return "501-800";
  if (population <= 1000) return "801-1000";
  return ">1000";
}
