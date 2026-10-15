import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { PhotoImage } from "@/components/shared/photo-image";
import { EmptyState } from "@/components/shared/empty-state";
import { CuratedPhotoForm } from "@/components/admin/curated-photo-form";
import { requireAdmin } from "@/application/session";
import { setPhotoFeaturedAction } from "@/application/actions/admin";
import { DeleteWithReason } from "@/components/admin/delete-with-reason";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { listCuratedPhotos } from "@/infrastructure/repositories/photos";
import { listSiteOptions } from "@/infrastructure/repositories/dive-sites";
import { listSpeciesOptions } from "@/infrastructure/repositories/species";
import { formatDate } from "@/lib/utils";

export default async function AdminPhotosPage() {
  await requireAdmin("/admin/photos");
  const db = await createSupabaseServerClient();
  const [photos, sites, species] = await Promise.all([listCuratedPhotos(db), listSiteOptions(db), listSpeciesOptions(db)]);

  return (
    <>
      <PageHeader
        title="Photos"
        description="Upload credited photos to Supabase Storage. These are separately licensed and never part of the open-source code."
      />
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Upload a photo</CardTitle>
            <CardDescription>Credit the photographer and state the licence. Featured photos appear as the homepage hero.</CardDescription>
          </CardHeader>
          <CardContent>
            <CuratedPhotoForm sites={sites} species={species} />
          </CardContent>
        </Card>
        {photos.length ? (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {photos.map((p) => (
              <li key={p.id} className="bg-card space-y-2 rounded-xl border p-3">
                <PhotoImage src={p.url} alt={p.caption ?? "Photo"} className="aspect-video w-full rounded-lg" />
                <p className="text-sm font-medium">{p.caption ?? p.speciesName ?? p.siteName}</p>
                <p className="text-muted-foreground text-xs">
                  © {p.attribution} · {p.license} · {formatDate(p.createdAt)}
                </p>
                <div className="flex flex-wrap gap-2">
                  <form action={setPhotoFeaturedAction}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="featured" value={String(!p.isFeatured)} />
                    <Button type="submit" size="sm" variant={p.isFeatured ? "default" : "outline"}>
                      <Star /> {p.isFeatured ? "Featured" : "Feature"}
                    </Button>
                  </form>
                  <DeleteWithReason kind="photo" id={p.id} name={p.caption ?? p.speciesName ?? p.siteName ?? "Photo"} />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="No uploaded photos yet" />
        )}
      </div>
    </>
  );
}
