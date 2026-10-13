"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import L from "leaflet";
import "leaflet.markercluster";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import type { DiveSiteMarker } from "@/domain/entities";
import { DIVE_TYPE_LABELS, EXPERIENCE_LABELS } from "@/domain/constants";
import { addToTripWithToast } from "@/components/trip/add-to-trip-button";
import { tripActions } from "@/components/trip/trip-store";
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
  // Unverified starter entries get a dashed outline.
  const stroke = marker.isVerified ? "" : ' stroke-dasharray="2.5 1.8"';
  const html = `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true" style="filter: drop-shadow(0 1px 2px rgba(0,0,0,.35))">
      <path d="M12 2C7.6 2 4 5.5 4 9.9 4 15.6 12 22 12 22s8-6.4 8-12.1C20 5.5 16.4 2 12 2z" fill="${color}" stroke="white" stroke-width="${selected ? 2 : 1.5}"${stroke}/>
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

/** Cluster bubble in the theme palette, sized by the number of sites. */
function clusterIcon(cluster: L.MarkerCluster) {
  const count = cluster.getChildCount();
  const size = count < 10 ? 34 : count < 50 ? 42 : 50;
  return L.divIcon({
    html: `<span>${count}</span>`,
    className: "dive-cluster",
    iconSize: [size, size],
  });
}

const escape = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function popupHtml(m: DiveSiteMarker) {
  const types = m.diveTypes.map((t) => DIVE_TYPE_LABELS[t]).join(" · ");
  const depth = m.maxDepthM != null ? ` · max ${m.maxDepthM} m` : "";
  const unverified =
    m.reviewLevel === "human"
      ? ""
      : `<p class="dive-popup-flag">${m.reviewLevel === "digital" ? "Digitally reviewed" : "Unverified starter entry"}</p>`;
  return `
    <div class="dive-popup">
      <p class="dive-popup-name">${escape(m.name)}</p>
      <p class="dive-popup-place">${escape(m.region)}, ${escape(m.country)}</p>
      <p class="dive-popup-meta">${escape(types)} — ${EXPERIENCE_LABELS[m.experienceLevel]}${depth}</p>
      ${unverified}
      <a href="/sites/${encodeURIComponent(m.slug)}">View site &amp; marine life →</a>
      <button type="button" class="dive-popup-trip" data-trip-slug="${escape(m.slug)}" data-trip-name="${escape(m.name)}" aria-pressed="false">+ Add to trip</button>
    </div>`;
}

function ClusteredMarkers({
  markers,
  selectedSlug,
  onSelect,
  showPopups,
  fitToMarkers,
}: Pick<DiveMapProps, "markers" | "selectedSlug" | "onSelect" | "showPopups" | "fitToMarkers">) {
  const map = useMap();
  const router = useRouter();
  const groupRef = useRef<L.MarkerClusterGroup | null>(null);
  const bySlug = useRef(new Map<string, L.Marker>());
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  // (Re)build the cluster layer when the marker set changes.
  useEffect(() => {
    const group = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 45,
      spiderfyOnMaxZoom: true,
      iconCreateFunction: clusterIcon,
    });
    bySlug.current = new Map();
    for (const m of markers) {
      const marker = L.marker([m.latitude, m.longitude], { icon: markerIcon(m, false), title: m.name, alt: m.name });
      if (showPopups) marker.bindPopup(popupHtml(m));
      marker.on("click", () => onSelectRef.current?.(m.slug));
      bySlug.current.set(m.slug, marker);
      group.addLayer(marker);
    }
    group.addTo(map);
    groupRef.current = group;

    if (fitToMarkers && markers.length) {
      if (markers.length === 1) map.setView([markers[0]!.latitude, markers[0]!.longitude], 9);
      else map.fitBounds(group.getBounds(), { padding: [40, 40], maxZoom: 9 });
    }
    return () => {
      group.remove();
      groupRef.current = null;
    };
  }, [map, markers, showPopups, fitToMarkers]);

  // "Add to trip" buttons inside popups (plain HTML, so handled by delegation).
  useEffect(() => {
    const container = map.getContainer();
    const show = (btn: HTMLElement, inTrip: boolean) => {
      btn.setAttribute("aria-pressed", String(inTrip));
      btn.textContent = inTrip ? "✓ In your trip" : "+ Add to trip";
    };
    const onClick = (e: MouseEvent) => {
      const btn = (e.target as HTMLElement).closest<HTMLElement>("[data-trip-slug]");
      if (!btn) return;
      const site = { slug: btn.dataset.tripSlug!, name: btn.dataset.tripName ?? "" };
      if (btn.getAttribute("aria-pressed") === "true") tripActions.remove(site.slug);
      else addToTripWithToast(site, () => router.push("/trip"));
      show(btn, btn.getAttribute("aria-pressed") !== "true");
    };
    const onOpen = (e: L.PopupEvent) => {
      const btn = e.popup.getElement()?.querySelector<HTMLElement>("[data-trip-slug]");
      if (!btn) return;
      show(btn, tripActions.has(btn.dataset.tripSlug!));
    };
    container.addEventListener("click", onClick);
    map.on("popupopen", onOpen);
    return () => {
      container.removeEventListener("click", onClick);
      map.off("popupopen", onOpen);
    };
  }, [map, router]);

  // Highlight and reveal the selected site.
  useEffect(() => {
    const data = new Map(markers.map((m) => [m.slug, m]));
    bySlug.current.forEach((marker, slug) => marker.setIcon(markerIcon(data.get(slug)!, slug === selectedSlug)));
    const marker = selectedSlug ? bySlug.current.get(selectedSlug) : undefined;
    const group = groupRef.current;
    if (!marker || !group) return;
    group.zoomToShowLayer(marker, () => {
      if (showPopups) marker.openPopup();
    });
  }, [markers, selectedSlug, showPopups]);

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
      <ClusteredMarkers
        markers={markers}
        selectedSlug={selectedSlug}
        onSelect={onSelect}
        showPopups={showPopups}
        fitToMarkers={fitToMarkers}
      />
    </MapContainer>
  );
}
