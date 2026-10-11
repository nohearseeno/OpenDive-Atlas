"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import type { DiveSiteMarker } from "@/domain/entities";
import { DIVE_TYPE_LABELS, EXPERIENCE_LABELS } from "@/domain/constants";
import { LEVEL_COLORS, TILE_ATTRIBUTION, TILE_URL } from "./map-config";

export interface DiveMapProps {
  markers: DiveSiteMarker[];
  selectedSlug?: string | null;
  onSelect?: (slug: string) => void;
  /** Initial center/zoom when there is nothing to fit. */
  center?: [number, number];
  zoom?: number;
  /** Fit bounds to all markers on load/when markers change. */
  fitToMarkers?: boolean;
  /** Disable popups (e.g. single-site location map). */
  showPopups?: boolean;
  className?: string;
}

function markerIcon(marker: DiveSiteMarker, selected: boolean) {
  const color = LEVEL_COLORS[marker.experienceLevel];
  const size = selected ? 34 : 26;
  // Inline SVG pin — avoids Leaflet's default image assets, which break under bundlers.
  const html = `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true" style="filter: drop-shadow(0 1px 2px rgba(0,0,0,.35))">
      <path d="M12 2C7.6 2 4 5.5 4 9.9 4 15.6 12 22 12 22s8-6.4 8-12.1C20 5.5 16.4 2 12 2z" fill="${color}" stroke="white" stroke-width="${selected ? 2 : 1.5}"/>
      <circle cx="12" cy="10" r="3.2" fill="white"/>
    </svg>`;
  return L.divIcon({
    html,
    className: "dive-marker",
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size + 4],
  });
}

function FitBounds({ markers, enabled }: { markers: DiveSiteMarker[]; enabled: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (!enabled || markers.length === 0) return;
    if (markers.length === 1) {
      map.setView([markers[0]!.latitude, markers[0]!.longitude], 9);
      return;
    }
    const bounds = L.latLngBounds(markers.map((m) => [m.latitude, m.longitude] as [number, number]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 9 });
  }, [map, markers, enabled]);
  return null;
}

function FlyToSelected({ marker }: { marker: DiveSiteMarker | undefined }) {
  const map = useMap();
  useEffect(() => {
    if (!marker) return;
    map.flyTo([marker.latitude, marker.longitude], Math.max(map.getZoom(), 9), { duration: 0.8 });
  }, [map, marker]);
  return null;
}

export default function DiveMap({
  markers,
  selectedSlug,
  onSelect,
  center = [15, -40],
  zoom = 2,
  fitToMarkers = true,
  showPopups = true,
  className,
}: DiveMapProps) {
  const selected = useMemo(() => markers.find((m) => m.slug === selectedSlug), [markers, selectedSlug]);

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      minZoom={2}
      worldCopyJump
      scrollWheelZoom
      className={className}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} maxZoom={18} />
      <FitBounds markers={markers} enabled={fitToMarkers} />
      <FlyToSelected marker={selected} />
      {markers.map((m) => (
        <Marker
          key={m.id}
          position={[m.latitude, m.longitude]}
          icon={markerIcon(m, m.slug === selectedSlug)}
          title={m.name}
          alt={m.name}
          eventHandlers={onSelect ? { click: () => onSelect(m.slug) } : undefined}
        >
          {showPopups && (
            <Popup>
              <div className="min-w-44 space-y-1">
                <p className="text-base font-semibold">{m.name}</p>
                <p className="text-muted-foreground text-xs">
                  {m.region}, {m.country}
                </p>
                <p className="text-xs">
                  {m.diveTypes.map((t) => DIVE_TYPE_LABELS[t]).join(" · ")} — {EXPERIENCE_LABELS[m.experienceLevel]}
                  {m.maxDepthM != null && ` · max ${m.maxDepthM} m`}
                </p>
                <Link href={`/sites/${m.slug}`} className="text-primary inline-block pt-1 text-sm font-medium">
                  View site & marine life →
                </Link>
              </div>
            </Popup>
          )}
        </Marker>
      ))}
    </MapContainer>
  );
}
