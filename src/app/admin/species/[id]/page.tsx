import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { SpeciesForm } from "@/components/admin/species-form";
import { ExternalPhotoForm } from "@/components/admin/external-photo-form";
import { requireAdmin } from "@/application/session";
import { deleteSpeciesAction } from "@/application/actions/admin";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { getSpeciesById } from "@/infrastructure/repositories/species";
import { uuidSchema } from "@/domain/schemas";

export default async function EditSpeciesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdmin(`/admin/species/${id}`);
  if (!uuidSchema.safeParse(id).success) notFound();
  const species = await getSpeciesById(await createSupabaseServerClient(), id);
  if (!species) notFound();

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
            <CardTitle>Add a reference photo</CardTitle>
            <CardDescription>Openly licensed images only. Always include attribution and licence.</CardDescription>
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
