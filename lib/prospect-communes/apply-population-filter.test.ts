import { describe, expect, it } from "vitest";
import {
  matchesPopulationFilter,
  parseBboxParam,
} from "@/lib/prospect-communes/filter-params";

describe("matchesPopulationFilter", () => {
  it("matches OR between buckets", () => {
    expect(matchesPopulationFilter(300, ["0-500", "501-800"])).toBe(true);
    expect(matchesPopulationFilter(600, ["0-500", "501-800"])).toBe(true);
    expect(matchesPopulationFilter(900, ["0-500", "501-800"])).toBe(false);
  });

  it("matches range only", () => {
    expect(matchesPopulationFilter(1200, [], 1000, 1500)).toBe(true);
    expect(matchesPopulationFilter(800, [], 1000, 1500)).toBe(false);
  });

  it("combines buckets OR with range AND", () => {
    expect(matchesPopulationFilter(450, ["0-500"], 400, 500)).toBe(true);
    expect(matchesPopulationFilter(450, ["0-500"], 500, 800)).toBe(false);
    expect(matchesPopulationFilter(700, ["0-500"], 400, 800)).toBe(false);
  });

  it("matches 2000+ bucket", () => {
    expect(matchesPopulationFilter(49360, ["2000+"])).toBe(true);
    expect(matchesPopulationFilter(1500, ["2000+"])).toBe(false);
  });
});

describe("parseBboxParam", () => {
  it("parses valid bbox", () => {
    expect(parseBboxParam("48.9000,1.2000,49.1000,1.5500")).toEqual({
      south: 48.9,
      west: 1.2,
      north: 49.1,
      east: 1.55,
    });
  });

  it("rejects inverted bounds", () => {
    expect(parseBboxParam("49.1,1.2,48.9,1.55")).toBeUndefined();
  });

  it("rejects out-of-france coords", () => {
    expect(parseBboxParam("30,1,31,2")).toBeUndefined();
  });
});
