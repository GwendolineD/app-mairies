import { describe, expect, it } from "vitest";
import {
  formatProspectAnnualSubscriptionPrice,
  formatProspectPricePerInhabitantPerYear,
  getProspectSubscriptionPricing,
} from "@/lib/prospect-communes/subscription-pricing";

describe("getProspectSubscriptionPricing", () => {
  it("returns 290 € for 0–500 inhabitants", () => {
    expect(getProspectSubscriptionPricing(500)).toEqual({
      kind: "fixed",
      annualPriceEur: 290,
      pricePerInhabitantPerYearEur: 0.58,
    });
  });

  it("returns 350 € for 501–1000 inhabitants", () => {
    expect(getProspectSubscriptionPricing(800)).toEqual({
      kind: "fixed",
      annualPriceEur: 350,
      pricePerInhabitantPerYearEur: 0.44,
    });
  });

  it("returns 460 € for 1001–2000 inhabitants", () => {
    expect(getProspectSubscriptionPricing(1500)).toEqual({
      kind: "fixed",
      annualPriceEur: 460,
      pricePerInhabitantPerYearEur: 0.31,
    });
  });

  it('returns "Sur devis" above 2000 inhabitants', () => {
    expect(getProspectSubscriptionPricing(2434)).toEqual({ kind: "quote" });
  });

  it("rounds price per inhabitant to 2 decimals", () => {
    expect(getProspectSubscriptionPricing(666)).toEqual({
      kind: "fixed",
      annualPriceEur: 350,
      pricePerInhabitantPerYearEur: 0.53,
    });
  });

  it("returns null for invalid population", () => {
    expect(getProspectSubscriptionPricing(0)).toBeNull();
    expect(getProspectSubscriptionPricing(-10)).toBeNull();
  });
});

describe("formatProspectAnnualSubscriptionPrice", () => {
  it("formats annual price in French", () => {
    expect(formatProspectAnnualSubscriptionPrice(290)).toBe("290 € / an");
  });
});

describe("formatProspectPricePerInhabitantPerYear", () => {
  it("formats per-inhabitant price with 2 decimals", () => {
    expect(formatProspectPricePerInhabitantPerYear(0.58)).toBe("0,58 € / hab. / an");
  });
});
