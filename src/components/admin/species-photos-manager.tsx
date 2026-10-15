import { ExternalLink, Star, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PhotoImage } from "@/components/shared/photo-image";
import { EmptyState } from "@/components/shared/empty-state";
import { deletePhotoAction, setSpeciesCoverAction } from "@/application/actions/admin";
import type { Photo, Species } from "@/domain/entities";

/**
 * Every photo of a species, with controls to choose the cover shown on cards
 * and galleries, and to remove photos (for example a link that no longer loads).
 */
export function SpeciesPhotosManager({ species, photos }: { species: Species; photos: Photo[] }) {
  if (!photos.length) {
    return <EmptyState title="No photos yet">Upload one or link an openly licensed image below.</EmptyState>;
  }
  const approved = photos.filter((p) => p.status === "approved");
  const chosen = approved.find((p) => p.id === species.coverPhotoId);
  const coverId = (chosen ?? approved[0])?.id;

  return (
    <div className="space-y-4">
      <div className="text-muted-foreground flex flex-wrap items-center justify-between gap-2 text-sm">
        <p>
          {chosen
            ? "You chose the cover photo."
            : "No cover chosen: the oldest approved photo is used."}{" "}
          A fish placeholder means the image did not load; replace or delete it.
        </p>
        {chosen && (
          <form action={setSpeciesCoverAction}>
            <input type="hidden" name="speciesId" value={species.id} />
            <input type="hidden" name="photoId" value="" />
            <Button type="submit" variant="ghost" size="sm">
              Use automatic cover
            </Button>
          </form>
        )}
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {photos.map((p) => (
          <li key={p.id} className="space-y-2 rounded-lg border p-3">
            <PhotoImage src={p.url} alt={p.caption ?? species.commonName} className="aspect-video w-full rounded-md" />
            <div className="flex flex-wrap items-center gap-1.5">
              {p.id === coverId && (
                <Badge>
                  <Star /> Cover
                </Badge>
              )}
              {p.status !== "approved" && <Badge variant="outline">{p.status}</Badge>}
              <Badge variant="secondary">{p.storagePath ? "Uploaded" : "Linked"}</Badge>
            </div>
            {p.caption && <p className="text-sm font-medium">{p.caption}</p>}
            <p className="text-muted-foreground text-xs">
              {[p.attribution, p.license].filter(Boolean).join(" · ") || "No credit recorded"}
              {p.sourceUrl && (
                <>
                  {" · "}
                  <a href={p.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 underline">
                    Source <ExternalLink className="size-3" />
                  </a>
                </>
              )}
            </p>
            <div className="flex flex-wrap gap-2">
              {p.status === "approved" && p.id !== species.coverPhotoId && (
                <form action={setSpeciesCoverAction}>
                  <input type="hidden" name="speciesId" value={species.id} />
                  <input type="hidden" name="photoId" value={p.id} />
                  <Button type="submit" variant="outline" size="sm">
                    <Star /> Make cover
                  </Button>
                </form>
              )}
              <form action={deletePhotoAction}>
                <input type="hidden" name="id" value={p.id} />
                <Button type="submit" variant="ghost" size="sm" className="text-destructive">
                  <Trash2 /> Delete
                </Button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
