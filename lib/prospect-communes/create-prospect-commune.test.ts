import { describe, expect, it, vi, afterEach } from "vitest";
import {
  isUniqueViolation,
  resolveProspectPopulation,
} from "@/lib/prospect-communes/create-prospect-commune";
import {
  geocodeBanAddress,
  resolveProspectCoordinates,
} from "@/lib/prospect-communes/resolve-coordinates";

describe("resolveProspectPopulation", () => {
  it("prefers geo population over client fallback", () => {
    const result = resolveProspectPopulation(1500, 99999);
    expect(result).toEqual({ population: 1500 });
  });

  it("uses populationFallback when geo has no population", () => {
    const result = resolveProspectPopulation(undefined, 800);
    expect(result).toEqual({ population: 800 });
  });

  it("returns error when population is missing", () => {
    const result = resolveProspectPopulation(null, undefined);
    expect(result).toEqual({
      error: "Population requise — saisissez-la manuellement.",
    });
  });
});

describe("isUniqueViolation", () => {
  it("detects postgres unique violation", () => {
    expect(isUniqueViolation({ code: "23505" })).toBe(true);
    expect(isUniqueViolation({ code: "23503" })).toBe(false);
    expect(isUniqueViolation(null)).toBe(false);
  });
});

describe("resolveProspectCoordinates", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns BAN coordinates when geocoding succeeds", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        features: [{ geometry: { coordinates: [1.2, 48.5] } }],
      }),
    } as Response);

    const result = await resolveProspectCoordinates({
      adresse_mairie: "Mairie, 27220 Les Authieux",
      insee_code: "27220",
    });

    expect(result).toEqual({
      latitude: 48.5,
      longitude: 1.2,
      geocode_source: "ban",
      insee_code: "27220",
    });
  });

  it("falls back to centroid when BAN fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: false,
    } as Response);

    const result = await resolveProspectCoordinates({
      adresse_mairie: "Adresse inconnue",
      insee_code: "27220",
      centroid: { lat: 49.1, lng: 1.5 },
    });

    expect(result).toEqual({
      latitude: 49.1,
      longitude: 1.5,
      geocode_source: "centroid",
      insee_code: "27220",
    });
  });

  it("returns failed when BAN and centroid are unavailable", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ features: [] }),
    } as Response);

    const result = await resolveProspectCoordinates({
      adresse_mairie: "Adresse inconnue",
      insee_code: null,
    });

    expect(result).toEqual({
      latitude: null,
      longitude: null,
      geocode_source: "failed",
      insee_code: null,
    });
  });

  it("skips geocoding when skipGeocoded and existing coords are valid", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const result = await resolveProspectCoordinates({
      adresse_mairie: "Mairie",
      insee_code: "27220",
      skipGeocoded: true,
      existing: {
        latitude: 48.1,
        longitude: 1.1,
        geocode_source: "ban",
      },
    });

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result.geocode_source).toBe("ban");
    expect(result.latitude).toBe(48.1);
  });
});

describe("geocodeBanAddress", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns null when BAN response has no features", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ features: [] }),
    } as Response);

    await expect(geocodeBanAddress("test")).resolves.toBeNull();
  });
});
