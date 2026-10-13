"use client";

import type { DiveSiteMarker } from "@/domain/entities";
import { DiveMapClient } from "./dive-map-client";

export function SiteLocationMap({ marker }: { marker: DiveSiteMarker }) {
  return (
    <DiveMapClient
      markers={[marker]}
      selectedSlug={marker.slug}
      center={[marker.latitude, marker.longitude]}
      zoom={9}
      fitToMarkers={false}
      showPopups={false}
    />
  );
}
