/** French population label — regular space (PDF-safe, no narrow no-break space). */
export function formatPopulationFr(population: number): string {
  return population
    .toLocaleString("fr-FR")
    .replace(/\u202f/g, " ")
    .replace(/\u00a0/g, " ");
}
