import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { SpeciesForm } from "@/components/admin/species-form";
import { ExternalPhotoForm } from "@/components/admin/external-photo-form";
import { CuratedPhotoForm } from "@/components/admin/curated-photo-form";
import { SpeciesPhotosManager } from "@/components/admin/species-photos-manager";
import { requireAdmin } from "@/application/session";
import { deleteSpeciesAction } from "@/application/actions/admin";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { getSpeciesById } from "@/infrastructure/repositories/species";
import { listAllSpeciesPhotos } from "@/infrastructure/repositories/photos";
import { listSiteOptions } from "@/infrastructure/repositories/dive-sites";
import { uuidSchema } from "@/domain/schemas";

export default async function EditSpeciesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdmin(`/admin/species/${id}`);
  if (!uuidSchema.safeParse(id).success) notFound();
  const db = await createSupabaseServerClient();
  const species = await getSpeciesById(db, id);
  if (!species) notFound();
  const [photos, sites] = await Promise.all([listAllSpeciesPhotos(db, species.id), listSiteOptions(db)]);
  const speciesOption = {
    id: species.id,
    slug: species.slug,
    commonName: species.commonName,
    scientificName: species.scientificName,
  };

  return (
    <>
      <PageHeader
        title={`Edit ${species.commonName}`}
        actions={
          <Button asChild variant="outline">
            <Link href={`/species/${species.slug}`}>
              <ExternalLink /> View
            </Link>
          </Button>
        }
      />
      <div className="grid gap-6">
        <Card>
          <CardContent>
            <SpeciesForm species={species} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Photos</CardTitle>
            <CardDescription>
              The cover photo appears on species cards, dive site species lists and site galleries.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SpeciesPhotosManager species={species} photos={photos} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Upload a photo</CardTitle>
            <CardDescription>
              Stored on OpenDive Atlas, so it keeps loading even if the original source changes. Credit the
              photographer and state the licence.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CuratedPhotoForm sites={sites} species={[speciesOption]} defaultSpeciesId={species.id} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Link an openly licensed photo</CardTitle>
            <CardDescription>
              For Wikimedia Commons, link the resized image (Special:FilePath/File_name.jpg?width=800), not the
              full-size original on upload.wikimedia.org, which Commons may refuse to serve to other sites.
              Always include attribution and licence.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ExternalPhotoForm speciesId={species.id} />
          </CardContent>
        </Card>
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle>Danger zone</CardTitle>
            <CardDescription>Deleting a species also deletes its sightings and photos.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={deleteSpeciesAction}>
              <input type="hidden" name="id" value={species.id} />
              <Button type="submit" variant="destructive">
                <Trash2 /> Delete species
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
