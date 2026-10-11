"use client";

import { useState } from "react";
import Link from "next/link";
import { List, MapPin, Star } from "lucide-react";
import type { DiveSiteMarker } from "@/domain/entities";
import { DIVE_TYPE_LABELS, EXPERIENCE_LABELS } from "@/domain/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DiveMapClient } from "./dive-map-client";
import { MapLegend } from "./map-legend";
import { LEVEL_COLORS } from "./map-config";

/**
 * Full-screen map explorer: results list + interactive map.
 * On mobile the list collapses behind a toggle so the map stays usable.
 */
export function MapExplorer({ markers, filters }: { markers: DiveSiteMarker[]; filters: React.ReactNode }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [showList, setShowList] = useState(false);

  return (
    <div className="relative flex h-[calc(100dvh-3.5rem)] flex-col md:flex-row">
      <aside
        className={cn(
          "bg-background z-20 flex w-full flex-col border-b md:h-full md:w-96 md:border-r md:border-b-0",
          showList ? "absolute inset-0 md:static" : "",
        )}
      >
        <div className="space-y-3 border-b p-4">
          {filters}
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm" aria-live="polite">
              {markers.length} {markers.length === 1 ? "site" : "sites"}
            </p>
            <Button variant="outline" size="sm" className="md:hidden" onClick={() => setShowList((v) => !v)}>
              {showList ? <MapPin /> : <List />} {showList ? "Show map" : "Show list"}
            </Button>
          </div>
        </div>
        <ul className={cn("flex-1 divide-y overflow-y-auto", showList ? "block" : "hidden md:block")}>
          {markers.map((m) => (
            <li key={m.id}>
              <div
                className={cn(
                  "hover:bg-accent/60 flex gap-3 p-4 transition-colors",
                  selected === m.slug && "bg-accent",
                )}
              >
                <span
                  className="mt-1.5 size-3 shrink-0 rounded-full"
                  style={{ background: LEVEL_COLORS[m.experienceLevel] }}
                  aria-hidden
                />
                <div className="min-w-0 flex-1 space-y-1">
                  <button
                    type="button"
                    className="text-left font-medium hover:underline"
                    onClick={() => {
                      setSelected(m.slug);
                      setShowList(false);
                    }}
                  >
                    {m.name}
                  </button>
                  <p className="text-muted-foreground truncate text-xs">
                    {m.region}, {m.country}
                  </p>
                  <div className="flex flex-wrap items-center gap-1">
                    {m.diveTypes.slice(0, 3).map((t) => (
                      <Badge key={t} variant="secondary">
                        {DIVE_TYPE_LABELS[t]}
                      </Badge>
                    ))}
                    <Badge variant="outline">{EXPERIENCE_LABELS[m.experienceLevel]}</Badge>
                    {m.ratingOverall != null && (
                      <span className="text-muted-foreground inline-flex items-center gap-0.5 text-xs">
                        <Star className="size-3 fill-amber-400 text-amber-400" /> {m.ratingOverall.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
                <Link href={`/sites/${m.slug}`} className="text-primary self-center text-sm font-medium whitespace-nowrap">
                  Details
                </Link>
              </div>
            </li>
          ))}
          {markers.length === 0 && (
            <li className="text-muted-foreground p-6 text-center text-sm">No dive sites match these filters.</li>
          )}
        </ul>
      </aside>
      <section className="relative flex-1" aria-label="Dive site map">
        <DiveMapClient markers={markers} selectedSlug={selected} onSelect={setSelected} />
        <MapLegend className="bg-background/90 absolute bottom-6 left-3 z-[15] rounded-md border px-3 py-2 shadow-sm" />
      </section>
    </div>
  );
}
