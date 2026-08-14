import { describe, expect, it } from "vitest";
import { extractPostcode } from "@/lib/prospect-communes/extract-postcode";
import { parseOpeningDays } from "@/lib/prospect-communes/parse-opening-days";

describe("extractPostcode", () => {
  it("extracts postcode from mairie address", () => {
    expect(extractPostcode("6 rue de Jumelles, 27220, Les Authieux")).toBe(
      "27220",
    );
  });

  it("returns null when missing", () => {
    expect(extractPostcode("")).toBeNull();
    expect(extractPostcode(undefined)).toBeNull();
  });
});

describe("parseOpeningDays", () => {
  it("parses pipe-separated horaires", () => {
    expect(parseOpeningDays("Mardi: 17:00-18:30 | Vendredi: 17:00-18:30")).toEqual(
      ["Mardi", "Vendredi"],
    );
  });

  it("parses compound day ranges", () => {
    expect(parseOpeningDays("Lundi-Mardi: 16:30-18:00 | Vendredi: 17:00-19:00")).toEqual(
      ["Lundi", "Mardi", "Vendredi"],
    );
  });

  it("returns empty for blank horaires", () => {
    expect(parseOpeningDays("")).toEqual([]);
    expect(parseOpeningDays(null)).toEqual([]);
  });
});
