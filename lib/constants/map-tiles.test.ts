import { describe, expect, it } from "vitest";

import { buildMapTileUrl } from "@/lib/constants/map-tiles";

const CARTO_RASTER_BASE =
  "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

describe("buildMapTileUrl", () => {
  it("returns base URL when api key is missing", () => {
    expect(buildMapTileUrl()).toBe(CARTO_RASTER_BASE);
    expect(buildMapTileUrl("")).toBe(CARTO_RASTER_BASE);
    expect(buildMapTileUrl("   ")).toBe(CARTO_RASTER_BASE);
  });

  it("appends encoded api key as query parameter", () => {
    expect(buildMapTileUrl("abc123")).toBe(
      `${CARTO_RASTER_BASE}?key=abc123`,
    );
    expect(buildMapTileUrl(" key+with/special ")).toBe(
      `${CARTO_RASTER_BASE}?key=${encodeURIComponent("key+with/special")}`,
    );
  });
});
