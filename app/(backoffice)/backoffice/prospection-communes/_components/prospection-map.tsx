"use client";

import L from "leaflet";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  Rectangle,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Crosshair, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { MAP_TILE_URL } from "@/lib/constants/assets";
import {
  buildProspectCommunesQuery,
  mergeProspectCommunesParams,
  type ProspectCommunesListParams,
} from "@/lib/prospect-communes/filter-params";
import {
  getPopulationBucket,
  POPULATION_COLOR_HEX,
} from "@/lib/prospect-communes/population-buckets";
import { formatHorairesDisplay } from "@/lib/prospect-communes/format-horaires-display";
import type { ProspectCommuneListItem } from "@/lib/prospect-communes/types";
import { itemsWithCoordinates } from "@/lib/queries/backoffice-prospect-communes";
import { createAnnouncementPinIcon } from "@/lib/utils/announcement-map-pin";

type Props = {
  params: ProspectCommunesListParams;
  items: ProspectCommuneListItem[];
  withoutCoordinatesCount: number;
};

const PROSPECTION_MAP_ZOOM = 10;
const PROSPECTION_MAP_CENTER: [number, number] = [48.95, 1.4];

function InitializeMapView({
  items,
  zoom,
}: {
  items: ProspectCommuneListItem[];
  zoom: number;
}) {
  const map = useMap();
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    if (items.length === 0) {
      map.setView(PROSPECTION_MAP_CENTER, zoom, { animate: false });
      return;
    }

    const bounds = L.latLngBounds(
      items.map((item) => [item.latitude!, item.longitude!] as [number, number]),
    );
    // Fixed zoom — fitBounds would zoom out to fit all markers across 3 departments.
    map.setView(bounds.getCenter(), zoom, { animate: false });
  }, [items, map, zoom]);

  return null;
}

function MapInteractionLock({ selectionMode }: { selectionMode: boolean }) {
  const map = useMap();

  useEffect(() => {
    if (selectionMode) {
      map.dragging.disable();
      map.doubleClickZoom.disable();
      map.boxZoom.disable();
    } else {
      map.dragging.enable();
      map.doubleClickZoom.enable();
      map.boxZoom.enable();
    }

    return () => {
      map.dragging.enable();
      map.doubleClickZoom.enable();
      map.boxZoom.enable();
    };
  }, [map, selectionMode]);

  return null;
}

function BboxDrawer({
  selectionMode,
  onComplete,
  onCancel,
}: {
  selectionMode: boolean;
  onComplete: (bbox: L.LatLngBounds) => void;
  onCancel: () => void;
}) {
  const map = useMap();
  const startRef = useRef<L.LatLng | null>(null);
  const rectRef = useRef<L.Rectangle | null>(null);

  useMapEvents({
    mousedown(event) {
      if (!selectionMode) return;
      startRef.current = event.latlng;
      rectRef.current?.remove();
      rectRef.current = L.rectangle(
        L.latLngBounds(event.latlng, event.latlng),
        {
          color: "#9a52ff",
          weight: 2,
          fillColor: "#9a52ff",
          fillOpacity: 0.12,
        },
      ).addTo(map);
    },
    mousemove(event) {
      if (!selectionMode || !startRef.current || !rectRef.current) return;
      rectRef.current.setBounds(L.latLngBounds(startRef.current, event.latlng));
    },
    mouseup(event) {
      if (!selectionMode || !startRef.current || !rectRef.current) return;
      const bounds = L.latLngBounds(startRef.current, event.latlng);
      rectRef.current.remove();
      rectRef.current = null;
      startRef.current = null;
      if (bounds.getNorth() - bounds.getSouth() < 0.001) return;
      if (bounds.getEast() - bounds.getWest() < 0.001) return;
      onComplete(bounds);
    },
  });

  useEffect(() => {
    if (!selectionMode) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onCancel, selectionMode]);

  useEffect(() => {
    const container = map.getContainer();
    container.style.cursor = selectionMode ? "crosshair" : "";
    return () => {
      container.style.cursor = "";
    };
  }, [map, selectionMode]);

  return null;
}

export function ProspectionMap({
  params,
  items,
  withoutCoordinatesCount,
}: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [selectionMode, setSelectionMode] = useState(false);
  const mapItems = useMemo(() => itemsWithCoordinates(items), [items]);

  const bboxBounds = useMemo(() => {
    if (!params.bbox) return null;
    return L.latLngBounds(
      [params.bbox.south, params.bbox.west],
      [params.bbox.north, params.bbox.east],
    );
  }, [params.bbox]);

  const pushParams = useCallback(
    (next: ProspectCommunesListParams) => {
      startTransition(() => {
        router.replace(`${pathname}${buildProspectCommunesQuery(next)}`);
      });
    },
    [pathname, router, startTransition],
  );

  const handleBboxComplete = useCallback(
    (bounds: L.LatLngBounds) => {
      setSelectionMode(false);
      pushParams(
        mergeProspectCommunesParams(params, {
          bbox: {
            south: bounds.getSouth(),
            west: bounds.getWest(),
            north: bounds.getNorth(),
            east: bounds.getEast(),
          },
        }),
      );
    },
    [params, pushParams],
  );

  function clearBbox() {
    pushParams(mergeProspectCommunesParams(params, { bbox: undefined }));
  }

  function openDetail(id: string) {
    pushParams(mergeProspectCommunesParams(params, { detailId: id }));
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant={selectionMode ? "primary" : "secondary"}
            size="sm"
            className="cursor-pointer"
            onClick={() => setSelectionMode((value) => !value)}
          >
            <Crosshair className="size-4" aria-hidden />
            {selectionMode ? "Mode sélection actif" : "Sélectionner une zone"}
          </Button>
          {params.bbox ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="cursor-pointer"
              onClick={clearBbox}
            >
              <X className="size-4" aria-hidden />
              Effacer la zone
            </Button>
          ) : null}
          {withoutCoordinatesCount > 0 ? (
            <p className="text-xs font-medium text-muted">
              {withoutCoordinatesCount} commune
              {withoutCoordinatesCount > 1 ? "s" : ""} sans position (non affichée
              {withoutCoordinatesCount > 1 ? "s" : ""} sur la carte)
            </p>
          ) : null}
        </div>
        {selectionMode ? (
          <p className="rounded-sm border border-purple/30 bg-soft-pink px-3 py-2 text-xs font-medium text-text">
            Le déplacement de la carte est désactivé : cliquez, glissez pour dessiner
            un rectangle, puis relâchez. Échap pour annuler. Le filtre s&apos;applique
            aussi en mode liste.
          </p>
        ) : params.bbox ? (
          <p className="text-xs font-medium text-muted">
            Zone active — passez en mode liste pour voir les communes filtrées, ou
            cliquez « Effacer la zone » pour élargir.
          </p>
        ) : (
          <p className="text-xs font-medium text-muted">
            Pour filtrer par zone géographique : activez « Sélectionner une zone »,
            puis tracez un rectangle sur la carte (clic maintenu + glisser).
          </p>
        )}
      </div>

      <MapContainer
        className="min-h-[420px] flex-1 rounded-xl border border-border/70 shadow-card"
        center={PROSPECTION_MAP_CENTER}
        zoom={PROSPECTION_MAP_ZOOM}
        scrollWheelZoom
        style={{ minHeight: 420 }}
      >
        <TileLayer url={MAP_TILE_URL} />
        <InitializeMapView items={mapItems} zoom={PROSPECTION_MAP_ZOOM} />
        <MapInteractionLock selectionMode={selectionMode} />
        <BboxDrawer
          selectionMode={selectionMode}
          onComplete={handleBboxComplete}
          onCancel={() => setSelectionMode(false)}
        />
        {bboxBounds ? (
          <Rectangle
            bounds={bboxBounds}
            pathOptions={{
              color: "#9a52ff",
              weight: 2,
              fillColor: "#9a52ff",
              fillOpacity: 0.12,
            }}
          />
        ) : null}
        {mapItems.map((item) => {
          const bucket = getPopulationBucket(item.population);
          const colorHex = POPULATION_COLOR_HEX[bucket.colorToken];
          return (
            <Marker
              key={item.id}
              position={[item.latitude!, item.longitude!]}
              icon={createAnnouncementPinIcon(
                { mapPinUrl: null, colorHex },
                params.detailId === item.id,
                "default",
              )}
              eventHandlers={{
                click: () => openDetail(item.id),
              }}
            >
              <Popup>
                <div className="space-y-1 text-sm">
                  <p className="font-semibold">{item.commune}</p>
                  <p className="text-muted">
                    {item.population.toLocaleString("fr-FR")} hab.
                  </p>
                  <p className="text-muted">Maire : {item.maire ?? "—"}</p>
                  <p className="text-xs leading-5 text-muted">
                    {formatHorairesDisplay(item.horaires_ouverture)}
                  </p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
