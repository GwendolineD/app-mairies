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
import { ChevronLeft, ChevronRight, Locate } from "lucide-react";
import { MAP_TILE_URL } from "@/lib/constants/assets";
import {
  createAnnouncementPinIcon,
  createClusterPinIcon,
} from "@/lib/utils/announcement-map-pin";
import {
  AnnouncementCard,
  AnnouncementMapCard,
} from "@/components/features/announcement-card";
import type { AnnouncementWithAuthor } from "@/lib/queries/announcements";
import type { MapMarker } from "@/lib/utils/map-markers";
import {
  groupMarkersByLocation,
  findGroupByMarkerId,
  type MarkerGroup,
} from "@/lib/utils/group-markers";
import { haversineDistanceMeters, zoomForRadiusMeters } from "@/lib/utils/geo";
import { cn } from "@/lib/utils/cn";

export type { MapMarker };

/**
 * Default search radius (meters) around the user address used to compute the
 * initial map zoom. Exposed as a module-level constant to make it trivial to tweak.
 */
export const DEFAULT_INITIAL_RADIUS_METERS = 300;

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
      const zoom = zoomForRadiusMeters(center[0], initialRadiusMeters, 480);
      map.setView(center, zoom, { animate: false });
      return;
    }
    if (markers.length > 0) {
      const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng]));
      map.fitBounds(bounds, { padding: [24, 24], maxZoom: 17 });
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

function ClusterPopup({
  items,
  onItemClick,
}: {
  items: AnnouncementWithAuthor[];
  onItemClick: (id: string) => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < items.length - 1;

  const scrollTo = (index: number) => {
    const container = scrollRef.current;
    if (!container) return;
    container.scrollTo({ left: index * 200, behavior: "smooth" });
    setCurrentIndex(index);
  };

  const handleScroll = () => {
    const container = scrollRef.current;
    if (!container) return;
    const newIndex = Math.round(container.scrollLeft / 200);
    setCurrentIndex(Math.max(0, Math.min(newIndex, items.length - 1)));
  };

  return (
    <div className="flex w-[200px] flex-col gap-2">
      <div className="flex items-center justify-end gap-2">
        <span className="text-xs font-semibold text-muted">
          {currentIndex + 1}/{items.length}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (canGoPrev) scrollTo(currentIndex - 1);
          }}
          disabled={!canGoPrev}
          className={cn(
            "inline-flex size-5 cursor-pointer items-center justify-center rounded-full transition",
            canGoPrev
              ? "bg-warm text-text hover:bg-border"
              : "cursor-not-allowed text-subtle opacity-40",
          )}
          aria-label="Annonce précédente"
        >
          <ChevronLeft className="size-3.5" aria-hidden />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (canGoNext) scrollTo(currentIndex + 1);
          }}
          disabled={!canGoNext}
          className={cn(
            "inline-flex size-5 cursor-pointer items-center justify-center rounded-full transition",
            canGoNext
              ? "bg-warm text-text hover:bg-border"
              : "cursor-not-allowed text-subtle opacity-40",
          )}
          aria-label="Annonce suivante"
        >
          <ChevronRight className="size-3.5" aria-hidden />
        </button>
      </div>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex snap-x snap-mandatory overflow-x-hidden"
      >
        {items.map((a) => (
          <div
            key={a.id}
            className="w-[200px] shrink-0 snap-center"
            onClick={(e) => {
              e.stopPropagation();
              onItemClick(a.id);
            }}
          >
            <AnnouncementCard announcement={a} layout="vertical" />
          </div>
        ))}
      </div>
    </div>
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

  const markerGroups = useMemo(
    () => groupMarkersByLocation(markers),
    [markers],
  );

  const selectedGroup = useMemo(
    () => (selectedId ? findGroupByMarkerId(markerGroups, selectedId) : undefined),
    [markerGroups, selectedId],
  );

  const handleMarkerClick = useCallback((id: string) => {
    setSelectedId(id);
    const node = cardRefs.current.get(id);
    if (node) {
      node.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, []);

  const handleGroupClick = useCallback(
    (group: MarkerGroup) => {
      const firstId = group.markers[0]?.id;
      if (firstId) {
        handleMarkerClick(firstId);
      }
    },
    [handleMarkerClick],
  );

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

          {markerGroups.map((group) => {
            const isCluster = group.markers.length > 1;
            const isSelected = selectedGroup?.key === group.key;

            const icon = isCluster
              ? createClusterPinIcon(
                  {
                    mapPinUrl: group.primaryMapPinUrl,
                    colorHex: group.primaryColorHex,
                  },
                  group.markers.length,
                  isSelected,
                )
              : createAnnouncementPinIcon(
                  {
                    mapPinUrl: group.primaryMapPinUrl,
                    colorHex: group.primaryColorHex,
                  },
                  isSelected,
                );

            const groupItems = group.markers
              .map((m) => itemMap.get(m.id))
              .filter((item): item is AnnouncementWithAuthor => item != null);

            return (
              <Marker
                key={group.key}
                position={[group.lat, group.lng]}
                icon={icon}
                eventHandlers={{
                  click: () => handleGroupClick(group),
                }}
                zIndexOffset={isSelected ? 1000 : 0}
              >
                <Popup
                  closeButton={false}
                  autoPan
                  className="vl-map-popup"
                  minWidth={isCluster ? 220 : 260}
                  maxWidth={isCluster ? 220 : 280}
                >
                  {isCluster ? (
                    <ClusterPopup items={groupItems} onItemClick={handleMarkerClick} />
                  ) : groupItems[0] ? (
                    <AnnouncementMapCard announcement={groupItems[0]} />
                  ) : (
                    <div className="text-sm font-semibold text-text">
                      {group.markers[0]?.title}
                    </div>
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
          <h3 className="text-xs font-semibold text-text md:text-sm">
            Annonces autour de vous{" "}
            <span className="font-medium text-muted">({sortedItems.length})</span>
          </h3>
          <div
            ref={carouselRef}
            className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-2 md:pl-1"
          >
            {sortedItems.map((a) => (
              <div
                key={a.id}
                ref={(node) => {
                  if (node) cardRefs.current.set(a.id, node);
                  else cardRefs.current.delete(a.id);
                }}
                className={cn(
                  "w-52 shrink-0 snap-start transition md:w-56",
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
