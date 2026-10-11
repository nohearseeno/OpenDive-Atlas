import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { SiteForm } from "@/components/admin/site-form";
import { SiteSpeciesManager } from "@/components/admin/site-species-manager";
import { ExternalPhotoForm } from "@/components/admin/external-photo-form";
import { requireAdmin } from "@/application/session";
import { deleteDiveSiteAction } from "@/application/actions/admin";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { getDiveSiteById, getSiteSpecies } from "@/infrastructure/repositories/dive-sites";
import { listSpeciesOptions } from "@/infrastructure/repositories/species";
import { uuidSchema } from "@/domain/schemas";

export default async function EditSitePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdmin(`/admin/sites/${id}`);
  if (!uuidSchema.safeParse(id).success) notFound();
  const db = await createSupabaseServerClient();
  const site = await getDiveSiteById(db, id);
  if (!site) notFound();
  const [siteSpecies, options] = await Promise.all([getSiteSpecies(db, site.id), listSpeciesOptions(db)]);

  return (
    <>
      <PageHeader
        title={`Edit ${site.name}`}
        actions={
          <Button asChild variant="outline">
            <Link href={`/sites/${site.slug}`}>
              <ExternalLink /> View
            </Link>
          </Button>
        }
      />
      <div className="grid gap-6">
        <Card>
          <CardContent>
            <SiteForm site={site} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Commonly sighted species</CardTitle>
            <CardDescription>Curated list shown on the site page alongside community sightings.</CardDescription>
          </CardHeader>
          <CardContent>
            <SiteSpeciesManager siteId={site.id} items={siteSpecies} options={options} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Add a reference photo</CardTitle>
            <CardDescription>Openly licensed images only. Always include attribution and licence.</CardDescription>
          </CardHeader>
          <CardContent>
            <ExternalPhotoForm siteId={site.id} />
          </CardContent>
        </Card>
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle>Danger zone</CardTitle>
            <CardDescription>Deleting a site also deletes its sightings, reviews and photos.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={deleteDiveSiteAction}>
              <input type="hidden" name="id" value={site.id} />
              <Button type="submit" variant="destructive">
                <Trash2 /> Delete dive site
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
