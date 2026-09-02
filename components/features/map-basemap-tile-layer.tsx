"use client";

import { useEffect } from "react";
import { TileLayer } from "react-leaflet";
import { MAP_TILE_ATTRIBUTION, MAP_TILE_URL } from "@/lib/constants/map-tiles";

let warnedMissingKey = false;

export function MapBasemapTileLayer() {
  useEffect(() => {
    if (warnedMissingKey || process.env.NEXT_PUBLIC_CARTO_API_KEY?.trim()) {
      return;
    }
    warnedMissingKey = true;
    console.warn(
      "[map] NEXT_PUBLIC_CARTO_API_KEY is missing — Carto tiles will show a watermark.",
    );
  }, []);

  return (
    <TileLayer
      url={MAP_TILE_URL}
      attribution={MAP_TILE_ATTRIBUTION}
      maxZoom={20}
      subdomains="abcd"
    />
  );
}
