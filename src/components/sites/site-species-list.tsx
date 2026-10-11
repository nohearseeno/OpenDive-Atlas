import Link from "next/link";
import { Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PhotoImage } from "@/components/shared/photo-image";
import type { Photo, SiteSpecies } from "@/domain/entities";
import { CATEGORY_LABELS, FREQUENCY_LABELS } from "@/domain/constants";
import { formatDate } from "@/lib/utils";

export function SiteSpeciesList({ items, covers }: { items: SiteSpecies[]; covers: Map<string, Photo> }) {
  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <li key={item.species.id} className="hover:bg-accent/40 relative flex gap-3 rounded-lg border p-3 transition-colors">
          <PhotoImage
            src={covers.get(item.species.id)?.url}
            alt={item.species.commonName}
            className="size-16 shrink-0 rounded-md"
          />
          <div className="min-w-0 space-y-1">
            <Link href={`/species/${item.species.slug}`} className="font-medium after:absolute after:inset-0 hover:underline">
              {item.species.commonName}
            </Link>
            <p className="text-muted-foreground truncate text-xs italic">{item.species.scientificName}</p>
            <div className="flex flex-wrap items-center gap-1">
              {item.frequency ? (
                <Badge variant={item.frequency === "abundant" || item.frequency === "common" ? "reef" : "secondary"}>
                  {FREQUENCY_LABELS[item.frequency]}
                </Badge>
              ) : (
                <Badge variant="outline">Community reported</Badge>
              )}
              <Badge variant="outline" className="hidden sm:inline-flex">
                {CATEGORY_LABELS[item.species.category]}
              </Badge>
            </div>
            {item.sightingCount > 0 && (
              <p className="text-muted-foreground flex items-center gap-1 text-xs">
                <Users className="size-3" aria-hidden />
                {item.sightingCount} {item.sightingCount === 1 ? "sighting" : "sightings"}
                {item.lastSightedOn && ` · last ${formatDate(item.lastSightedOn)}`}
              </p>
            )}
            {item.notes && <p className="text-muted-foreground text-xs">{item.notes}</p>}
          </div>
        </li>
      ))}
    </ul>
  );
}
