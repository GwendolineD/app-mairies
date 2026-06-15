"use client";

import L from "leaflet";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Locate } from "lucide-react";
import { MAP_TILE_URL } from "@/lib/constants/assets";
import {
  getAnnouncementPinHex,
  getAnnouncementPinImage,
} from "@/lib/constants/map-pins";
import {
  AnnouncementCard,
  AnnouncementMapCard,
} from "@/components/features/announcement-card";
import type { AnnouncementWithAuthor } from "@/lib/queries/announcements";
import type { MapMarker } from "@/lib/utils/map-markers";
import { haversineDistanceMeters, zoomForRadiusMeters } from "@/lib/utils/geo";
import { cn } from "@/lib/utils/cn";

export type { MapMarker };

/**
 * Default search radius (meters) around the user address used to compute the
 * initial map zoom. Exposed as a module-level constant to make it trivial to tweak.
 */
export const DEFAULT_INITIAL_RADIUS_METERS = 500;

type Props = {
  markers: MapMarker[];
  /** Full announcement payload — when provided, used to render rich pin popovers + a synced carousel. */
  items?: AnnouncementWithAuthor[];
  center: [number, number];
  zoom?: number;
  /** Initial radius (meters) used to compute zoom around `center`. */
  initialRadiusMeters?: number;
  /** When true, draw a marker at `center` to show the user's home. */
  showUserPin?: boolean;
  className?: string;
  /** Optional fallback for legacy callers (no rich popover). */
  carouselItems?: AnnouncementWithAuthor[];
};

function createPinIcon(categorySlug: string, selected: boolean): L.DivIcon {
  const color = getAnnouncementPinHex(categorySlug);
  const image = getAnnouncementPinImage(categorySlug);
  const size = selected ? 44 : 36;
  const ring = selected ? "0 0 0 4px rgba(154,82,255,0.35)" : "0 2px 8px rgba(37,38,48,0.22)";
  // Image pin with onerror fallback to the legacy color circle.
  const fallbackHtml = `<div style="background:${color};width:${size - 8}px;height:${size - 8}px;border-radius:50%;border:3px solid white;box-shadow:${ring};"></div>`;
  const html = image
    ? `<div style="position:relative;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;border-radius:50%;background:white;box-shadow:${ring};border:2px solid white;overflow:hidden;">
         <img src="${image}" alt="" width="${size - 4}" height="${size - 4}" style="width:${size - 4}px;height:${size - 4}px;object-fit:contain;" onerror="this.parentElement.innerHTML=${JSON.stringify(fallbackHtml)};" />
       </div>`
    : fallbackHtml;

  return L.divIcon({
    className: "vl-map-pin",
    html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function createUserIcon(): L.DivIcon {
  return L.divIcon({
    className: "vl-user-pin",
    html: `<div style="position:relative;width:18px;height:18px;border-radius:50%;background:#1bb9d9;border:3px solid white;box-shadow:0 0 0 6px rgba(27,185,217,0.25),0 2px 8px rgba(37,38,48,0.25);"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

/**
 * Sets initial bounds: fit user position + nearby items inside a radius circle,
 * or fall back to fitting all markers if user has no address.
 */
function InitialView({
  center,
  hasUser,
  initialRadiusMeters,
  markers,
}: {
  center: [number, number];
  hasUser: boolean;
  initialRadiusMeters: number;
  markers: MapMarker[];
}) {
  const map = useMap();
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    if (hasUser) {
      const zoom = zoomForRadiusMeters(center[0], initialRadiusMeters);
      map.setView(center, zoom, { animate: false });
      return;
    }
    if (markers.length > 0) {
      const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }, [map, hasUser, center, initialRadiusMeters, markers]);

  return null;
}

function CenterOnUserButton({ center }: { center: [number, number] }) {
  const map = useMap();
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        map.flyTo(center, Math.max(map.getZoom(), 14), { duration: 0.5 });
      }}
      className="absolute bottom-4 right-4 z-[400] inline-flex size-10 cursor-pointer items-center justify-center rounded-full bg-surface text-text shadow-card ring-1 ring-border/50 transition hover:bg-warm md:size-11"
      aria-label="Recentrer sur ma position"
    >
      <Locate className="size-4 md:size-5" aria-hidden />
    </button>
  );
}

export function MapContentView({
  markers,
  items,
  center,
  zoom,
  initialRadiusMeters = DEFAULT_INITIAL_RADIUS_METERS,
  showUserPin = false,
  className = "h-[420px] md:h-[520px] rounded-3xl overflow-hidden border border-border/70 shadow-card",
  carouselItems,
}: Props) {
  // Rich items take priority when provided; legacy `carouselItems` kept for back-compat.
  const richItems = useMemo(
    () => items ?? carouselItems ?? [],
    [items, carouselItems],
  );
  const itemMap = useMemo(
    () => new Map(richItems.map((it) => [it.id, it])),
    [richItems],
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
  const carouselRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const proto = L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown };
    delete proto._getIconUrl;
  }, []);

  // Sort the carousel by distance to user when we have one.
  const sortedItems = useMemo(() => {
    if (!showUserPin || richItems.length === 0) return richItems;
    return [...richItems].sort((a, b) => {
      const aLat = a.address_lat;
      const aLng = a.address_lng;
      const bLat = b.address_lat;
      const bLng = b.address_lng;
      if (aLat == null || aLng == null) return 1;
      if (bLat == null || bLng == null) return -1;
      const da = haversineDistanceMeters(
        { lat: center[0], lng: center[1] },
        { lat: aLat, lng: aLng },
      );
      const db = haversineDistanceMeters(
        { lat: center[0], lng: center[1] },
        { lat: bLat, lng: bLng },
      );
      return da - db;
    });
  }, [richItems, showUserPin, center]);

  const userIcon = useMemo(() => (showUserPin ? createUserIcon() : null), [showUserPin]);

  const handleMarkerClick = useCallback((id: string) => {
    setSelectedId(id);
    const node = cardRefs.current.get(id);
    if (node) {
      node.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, []);

  return (
    <div className="space-y-4">
      <div className="relative">
        <MapContainer
          className={className}
          center={center}
          zoom={zoom}
          scrollWheelZoom
          style={{ minHeight: 320 }}
        >
          <TileLayer url={MAP_TILE_URL} />
          <InitialView
            center={center}
            hasUser={showUserPin}
            initialRadiusMeters={initialRadiusMeters}
            markers={markers}
          />

          {showUserPin && userIcon ? (
            <Marker position={center} icon={userIcon} interactive={false} />
          ) : null}

          {markers.map((m) => {
            const isSelected = selectedId === m.id;
            const icon = createPinIcon(m.categorySlug, isSelected);
            const richItem = itemMap.get(m.id);
            return (
              <Marker
                key={m.id}
                position={[m.lat, m.lng]}
                icon={icon}
                eventHandlers={{ click: () => handleMarkerClick(m.id) }}
                zIndexOffset={isSelected ? 1000 : 0}
              >
                <Popup
                  closeButton={false}
                  autoPan
                  className="vl-map-popup"
                  minWidth={260}
                  maxWidth={280}
                >
                  {richItem ? (
                    <AnnouncementMapCard announcement={richItem} />
                  ) : (
                    <div className="text-sm font-semibold text-text">{m.title}</div>
                  )}
                </Popup>
              </Marker>
            );
          })}

          {showUserPin ? <CenterOnUserButton center={center} /> : null}
        </MapContainer>
      </div>

      {sortedItems.length > 0 ? (
        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-text md:text-base">
            Annonces autour de vous{" "}
            <span className="font-medium text-muted">({sortedItems.length})</span>
          </h3>
          <div
            ref={carouselRef}
            className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0"
          >
            {sortedItems.map((a) => (
              <div
                key={a.id}
                ref={(node) => {
                  if (node) cardRefs.current.set(a.id, node);
                  else cardRefs.current.delete(a.id);
                }}
                className={cn(
                  "w-64 shrink-0 snap-start transition md:w-72",
                  selectedId === a.id && "scale-[1.02]",
                )}
                onClick={() => setSelectedId(a.id)}
              >
                <AnnouncementCard
                  announcement={a}
                  layout="vertical"
                  highlighted={selectedId === a.id}
                />
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
