"use client";

import L from "leaflet";
import Link from "next/link";
import { useEffect, useMemo } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { MAP_TILE_URL } from "@/lib/constants/assets";
import { getAnnouncementPinHex } from "@/lib/constants/map-pins";
import { ROUTES } from "@/lib/constants/routes";
import { AnnouncementCard } from "@/components/features/announcement-card";
import type { AnnouncementWithAuthor } from "@/lib/queries/announcements";
import type { MapMarker } from "@/lib/utils/map-markers";

export type { MapMarker };

type Props = {
  markers: MapMarker[];
  center: [number, number];
  zoom?: number;
  carouselItems?: AnnouncementWithAuthor[];
  className?: string;
};

function createCategoryIcon(color: string) {
  return L.divIcon({
    className: "",
    html: `<div style="background:${color};width:28px;height:28px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(37,38,48,0.25)"></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

function FitBounds({ markers }: { markers: MapMarker[] }) {
  const map = useMap();
  useEffect(() => {
    if (markers.length === 0) return;
    const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
  }, [map, markers]);
  return null;
}

export function MapContentView({
  markers,
  center,
  zoom = 13,
  carouselItems = [],
  className = "h-[420px] rounded-3xl overflow-hidden border border-border/70 shadow-card",
}: Props) {
  useEffect(() => {
    const proto = L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown };
    delete proto._getIconUrl;
  }, []);

  const markerIcons = useMemo(
    () =>
      new Map(
        markers.map((m) => [
          m.id,
          createCategoryIcon(m.pinColor ?? getAnnouncementPinHex(m.categorySlug)),
        ]),
      ),
    [markers],
  );

  return (
    <div className="space-y-4">
      <MapContainer
        className={className}
        center={center}
        zoom={zoom}
        scrollWheelZoom
        style={{ minHeight: 320 }}
      >
        <TileLayer url={MAP_TILE_URL} />
        {markers.length > 0 ? <FitBounds markers={markers} /> : null}
        {markers.map((m) => (
          <Marker
            key={m.id}
            position={[m.lat, m.lng]}
            icon={markerIcons.get(m.id)}
          >
            <Popup>
              <Link
                href={ROUTES.annonces.detail(m.id)}
                className="text-sm font-semibold text-purple"
              >
                {m.title}
              </Link>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {carouselItems.length > 0 ? (
        <section className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted">
            Annonces autour de vous
          </h3>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {carouselItems.map((a) => (
              <div key={a.id} className="w-72 shrink-0">
                <AnnouncementCard announcement={a} layout="vertical" />
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
