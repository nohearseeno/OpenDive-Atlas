import Link from "next/link";
import { Measure } from "@/components/units/measure";
import { Calendar, ArrowDownToLine, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DiverAvatar, diverName } from "@/components/shared/diver-avatar";
import { PhotoGallery } from "@/components/photos/photo-gallery";
import { StatusBadge } from "@/components/shared/status-badge";
import type { Sighting } from "@/domain/entities";
import { deleteSightingAction } from "@/application/actions/sightings";
import { formatDate } from "@/lib/utils";

export function SightingList({
  sightings,
  currentUserId,
  canModerate = false,
  showSite = true,
  showStatus = false,
}: {
  sightings: Sighting[];
  currentUserId?: string | null;
  canModerate?: boolean;
  showSite?: boolean;
  showStatus?: boolean;
}) {
  return (
    <ul className="space-y-4">
      {sightings.map((s) => {
        const canDelete = canModerate || (currentUserId && s.diver?.id === currentUserId);
        return (
          <li key={s.id} className="bg-card space-y-3 rounded-xl border p-4">
            <div className="flex items-start gap-3">
              <DiverAvatar diver={s.diver} />
              <div className="min-w-0 flex-1">
                <p className="text-sm">
                  <span className="font-medium">{diverName(s.diver)}</span> saw{" "}
                  {s.quantity > 1 && <span>{s.quantity}× </span>}
                  <Link href={`/species/${s.species.slug}`} className="text-primary font-medium hover:underline">
                    {s.species.commonName}
                  </Link>
                  {showSite && (
                    <>
                      {" "}
                      at{" "}
                      <Link href={`/sites/${s.site.slug}`} className="text-primary font-medium hover:underline">
                        {s.site.name}
                      </Link>
                    </>
                  )}
                </p>
                <p className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="size-3" aria-hidden /> {formatDate(s.observedOn)}
                  </span>
                  {s.depthM != null && (
                    <span className="inline-flex items-center gap-1">
                      <ArrowDownToLine className="size-3" aria-hidden /> <Measure q="length" value={s.depthM} />
                    </span>
                  )}
                  {showStatus && <StatusBadge status={s.status} />}
                </p>
              </div>
              {canDelete && (
                <form action={deleteSightingAction}>
                  <input type="hidden" name="id" value={s.id} />
                  <Button type="submit" variant="ghost" size="icon" aria-label="Delete sighting">
                    <Trash2 className="size-4" />
                  </Button>
                </form>
              )}
            </div>
            {s.notes && <p className="text-sm whitespace-pre-line">{s.notes}</p>}
            {s.photos.length > 0 && <PhotoGallery photos={s.photos} label={`Photos of ${s.species.commonName}`} />}
          </li>
        );
      })}
    </ul>
  );
}
