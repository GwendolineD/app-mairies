"use client";

import L from "leaflet";
import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import {
  MapContainer,
  Marker,
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
import type { ProspectCommuneListItem } from "@/lib/prospect-communes/types";
import { itemsWithCoordinates } from "@/lib/queries/backoffice-prospect-communes";
import { createAnnouncementPinIcon } from "@/lib/utils/announcement-map-pin";
import { ProspectionMapHoverBridge, ProspectionMapHoverCard } from "./prospection-map-hover-card";

type Props = {
  params: ProspectCommunesListParams;
  items: ProspectCommuneListItem[];
  withoutCoordinatesCount: number;
};

type HoverCardPosition = {
  x: number;
  y: number;
  pinX: number;
  pinY: number;
  placement: "above" | "below";
};

const PROSPECTION_MAP_ZOOM = 10;
const PROSPECTION_MAP_CENTER: [number, number] = [48.95, 1.4];
const HOVER_CARD_WIDTH = 220;
const HOVER_CARD_HEIGHT = 230;
const HOVER_CARD_GAP = 4;
const HOVER_CARD_EDGE = 8;
const HOVER_PIN_HEIGHT = 36;
const HOVER_CLOSE_DELAY_MS = 350;

function canHoverPreview(): boolean {
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

function computeHoverCardPosition(
  map: L.Map,
  item: ProspectCommuneListItem,
): HoverCardPosition {
  const point = map.latLngToContainerPoint([item.latitude!, item.longitude!]);
  const { x: mapWidth, y: mapHeight } = map.getSize();
  const pinTop = point.y - HOVER_PIN_HEIGHT;

  const spaceAbove = pinTop;
  const spaceBelow = mapHeight - point.y;
  const needsFlipBelow =
    spaceAbove < HOVER_CARD_HEIGHT + HOVER_CARD_GAP &&
    spaceBelow > spaceAbove;

  const placement: HoverCardPosition["placement"] = needsFlipBelow
    ? "below"
    : "above";

  let x = point.x - HOVER_CARD_WIDTH / 2;
  x = Math.max(
    HOVER_CARD_EDGE,
    Math.min(x, mapWidth - HOVER_CARD_WIDTH - HOVER_CARD_EDGE),
  );

  let y =
    placement === "above"
      ? pinTop - HOVER_CARD_HEIGHT - HOVER_CARD_GAP
      : point.y + HOVER_CARD_GAP;

  if (placement === "above" && y < HOVER_CARD_EDGE) {
    y = point.y + HOVER_CARD_GAP;
    return { x, y, pinX: point.x, pinY: point.y, placement: "below" };
  }

  if (
    placement === "below" &&
    y + HOVER_CARD_HEIGHT > mapHeight - HOVER_CARD_EDGE
  ) {
    y = pinTop - HOVER_CARD_HEIGHT - HOVER_CARD_GAP;
    return { x, y, pinX: point.x, pinY: point.y, placement: "above" };
  }

  return { x, y, pinX: point.x, pinY: point.y, placement };
}

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
    map.setView(bounds.getCenter(), zoom, { animate: false });
  }, [items, map, zoom]);

  return null;
}

function FitMapToContainer() {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    const observer = new ResizeObserver(() => {
      map.invalidateSize({ animate: false });
    });
    observer.observe(container);
    map.invalidateSize({ animate: false });
    return () => observer.disconnect();
  }, [map]);

  return null;
}

function MapHoverSync({
  mapRef,
  hoveredItem,
  onPositionChange,
}: {
  mapRef: MutableRefObject<L.Map | null>;
  hoveredItem: ProspectCommuneListItem | null;
  onPositionChange: (item: ProspectCommuneListItem) => void;
}) {
  const map = useMap();

  useEffect(() => {
    mapRef.current = map;
    return () => {
      mapRef.current = null;
    };
  }, [map, mapRef]);

  useMapEvents({
    move() {
      if (hoveredItem) onPositionChange(hoveredItem);
    },
    zoom() {
      if (hoveredItem) onPositionChange(hoveredItem);
    },
    resize() {
      if (hoveredItem) onPositionChange(hoveredItem);
    },
  });

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

function ProspectionMapMarker({
  item,
  selected,
  selectionMode,
  isHovered,
  onHoverStart,
  onHoverEnd,
  onTapPreview,
}: {
  item: ProspectCommuneListItem;
  selected: boolean;
  selectionMode: boolean;
  isHovered: boolean;
  onHoverStart: (item: ProspectCommuneListItem) => void;
  onHoverEnd: () => void;
  onTapPreview: (item: ProspectCommuneListItem) => void;
}) {
  const bucket = getPopulationBucket(item.population);
  const colorHex = POPULATION_COLOR_HEX[bucket.colorToken];

  return (
    <Marker
      position={[item.latitude!, item.longitude!]}
      icon={createAnnouncementPinIcon(
        { mapPinUrl: null, colorHex },
        selected || isHovered,
        "default",
      )}
      eventHandlers={{
        mouseover: () => {
          if (selectionMode || !canHoverPreview()) return;
          onHoverStart(item);
        },
        mouseout: () => {
          if (selectionMode || !canHoverPreview()) return;
          onHoverEnd();
        },
        click: () => {
          if (selectionMode || canHoverPreview()) return;
          onTapPreview(item);
        },
      }}
    />
  );
}

export function ProspectionMap({
  params,
  items,
  withoutCoordinatesCount,
}: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const mapRef = useRef<L.Map | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const hoveredItemRef = useRef<ProspectCommuneListItem | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<ProspectCommuneListItem | null>(
    null,
  );
  const [hoverCardPosition, setHoverCardPosition] =
    useState<HoverCardPosition | null>(null);
  const mapItems = useMemo(() => itemsWithCoordinates(items), [items]);

  const bboxBounds = useMemo(() => {
    if (!params.bbox) return null;
    return L.latLngBounds(
      [params.bbox.south, params.bbox.west],
      [params.bbox.north, params.bbox.east],
    );
  }, [params.bbox]);

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current == null) return;
    window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = null;
  }, []);

  const clearHoverPreview = useCallback(() => {
    clearCloseTimer();
    hoveredItemRef.current = null;
    setHoveredItem(null);
    setHoverCardPosition(null);
  }, [clearCloseTimer]);

  const updateHoverCardPosition = useCallback((item: ProspectCommuneListItem) => {
    const map = mapRef.current;
    if (!map) return;
    setHoverCardPosition(computeHoverCardPosition(map, item));
  }, []);

  const showHoverPreview = useCallback(
    (item: ProspectCommuneListItem) => {
      if (
        hoveredItemRef.current &&
        hoveredItemRef.current.id !== item.id
      ) {
        return;
      }

      clearCloseTimer();
      hoveredItemRef.current = item;
      setHoveredItem(item);
      updateHoverCardPosition(item);
    },
    [clearCloseTimer, updateHoverCardPosition],
  );

  const scheduleHoverClose = useCallback(() => {
    if (!canHoverPreview()) return;
    clearCloseTimer();
    closeTimerRef.current = window.setTimeout(() => {
      hoveredItemRef.current = null;
      setHoveredItem(null);
      setHoverCardPosition(null);
    }, HOVER_CLOSE_DELAY_MS);
  }, [clearCloseTimer]);

  useEffect(() => () => clearCloseTimer(), [clearCloseTimer]);

  useEffect(() => {
    if (selectionMode) clearHoverPreview();
  }, [selectionMode, clearHoverPreview]);

  useEffect(() => {
    if (params.detailId) clearHoverPreview();
  }, [params.detailId, clearHoverPreview]);

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
    clearHoverPreview();
    pushParams(mergeProspectCommunesParams(params, { detailId: id }));
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="flex shrink-0 flex-col gap-2">
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

      <div className="relative min-h-[420px] flex-1 md:h-0 md:min-h-0">
        <div className="absolute inset-0 z-0 overflow-hidden rounded-xl border border-border/70 shadow-card">
          <MapContainer
            className="prospection-leaflet-map h-full w-full"
            center={PROSPECTION_MAP_CENTER}
            zoom={PROSPECTION_MAP_ZOOM}
            scrollWheelZoom
          >
            <TileLayer url={MAP_TILE_URL} />
            <FitMapToContainer />
            <InitializeMapView items={mapItems} zoom={PROSPECTION_MAP_ZOOM} />
            <MapHoverSync
              mapRef={mapRef}
              hoveredItem={hoveredItem}
              onPositionChange={updateHoverCardPosition}
            />
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
            {mapItems.map((item) => (
              <ProspectionMapMarker
                key={item.id}
                item={item}
                selected={params.detailId === item.id}
                selectionMode={selectionMode}
                isHovered={hoveredItem?.id === item.id}
                onHoverStart={showHoverPreview}
                onHoverEnd={scheduleHoverClose}
                onTapPreview={showHoverPreview}
              />
            ))}
          </MapContainer>
        </div>

        {hoveredItem && hoverCardPosition ? (
          <div className="pointer-events-none absolute inset-0 z-50 overflow-visible">
            <ProspectionMapHoverBridge
              pinX={hoverCardPosition.pinX}
              pinY={hoverCardPosition.pinY}
              cardX={hoverCardPosition.x}
              cardY={hoverCardPosition.y}
              cardWidth={HOVER_CARD_WIDTH}
              cardHeight={HOVER_CARD_HEIGHT}
              pinHeight={HOVER_PIN_HEIGHT}
              placement={hoverCardPosition.placement}
              onMouseEnter={clearCloseTimer}
              onMouseLeave={scheduleHoverClose}
            />
            <ProspectionMapHoverCard
              item={hoveredItem}
              x={hoverCardPosition.x}
              y={hoverCardPosition.y}
              placement={hoverCardPosition.placement}
              onOpenDetail={() => openDetail(hoveredItem.id)}
              onMouseEnter={clearCloseTimer}
              onMouseLeave={scheduleHoverClose}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
