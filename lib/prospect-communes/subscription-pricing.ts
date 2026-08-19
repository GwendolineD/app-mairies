export type ProspectSubscriptionPricing =
  | {
      kind: "fixed";
      annualPriceEur: number;
      pricePerInhabitantPerYearEur: number;
    }
  | {
      kind: "quote";
    };

export const PROSPECT_SUBSCRIPTION_QUOTE_LABEL = "Sur devis";

const PROSPECT_SUBSCRIPTION_TIERS = [
  { min: 0, max: 500, annualPriceEur: 290 },
  { min: 501, max: 1000, annualPriceEur: 350 },
  { min: 1001, max: 2000, annualPriceEur: 460 },
] as const;

const PROSPECT_SUBSCRIPTION_MAX_POPULATION = 2000;

export function getProspectSubscriptionPricing(
  population: number,
): ProspectSubscriptionPricing | null {
  if (!Number.isFinite(population) || population <= 0) {
    return null;
  }

  if (population > PROSPECT_SUBSCRIPTION_MAX_POPULATION) {
    return { kind: "quote" };
  }

  const tier = PROSPECT_SUBSCRIPTION_TIERS.find(
    (entry) => population >= entry.min && population <= entry.max,
  );
  if (!tier) {
    return null;
  }

  const pricePerInhabitantPerYearEur =
    Math.round((tier.annualPriceEur / population) * 100) / 100;

  return {
    kind: "fixed",
    annualPriceEur: tier.annualPriceEur,
    pricePerInhabitantPerYearEur,
  };
}

export function formatProspectAnnualSubscriptionPrice(annualPriceEur: number): string {
  return `${annualPriceEur.toLocaleString("fr-FR")} € / an`;
}

export function formatProspectPricePerInhabitantPerYear(
  pricePerInhabitantPerYearEur: number,
): string {
  const formatted = pricePerInhabitantPerYearEur.toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${formatted} € / hab. / an`;
}
