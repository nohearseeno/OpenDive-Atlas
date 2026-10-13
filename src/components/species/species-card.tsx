import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { PhotoImage } from "@/components/shared/photo-image";
import type { Photo, Species } from "@/domain/entities";
import { CATEGORY_LABELS } from "@/domain/constants";
import { IucnBadge } from "./iucn-badge";

export function SpeciesCard({ species, cover }: { species: Species; cover?: Photo }) {
  return (
    <article className="group bg-card relative overflow-hidden rounded-xl border shadow-sm transition-shadow hover:shadow-md">
      <PhotoImage
        src={cover?.url}
        alt={cover?.caption ?? species.commonName}
        className="aspect-[4/3] w-full"
        imgClassName="transition-transform duration-300 group-hover:scale-105"
      />
      <div className="space-y-1.5 p-4">
        <h3 className="font-semibold">
          <Link href={`/species/${species.slug}`} className="after:absolute after:inset-0">
            {species.commonName}
          </Link>
        </h3>
        <p className="text-muted-foreground text-sm italic">{species.scientificName}</p>
        <div className="flex flex-wrap gap-1">
          <Badge variant="secondary">{CATEGORY_LABELS[species.category]}</Badge>
          <IucnBadge status={species.iucnStatus} />
        </div>
      </div>
    </article>
  );
}
