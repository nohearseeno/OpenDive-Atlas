import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { SiteForm } from "@/components/admin/site-form";
import { SiteSpeciesManager } from "@/components/admin/site-species-manager";
import { ExternalPhotoForm } from "@/components/admin/external-photo-form";
import { isAdmin, requireModerator } from "@/application/session";
import { DeleteWithReason } from "@/components/admin/delete-with-reason";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { getDiveSiteById, getSiteSpecies } from "@/infrastructure/repositories/dive-sites";
import { listSpeciesOptions } from "@/infrastructure/repositories/species";
import { uuidSchema } from "@/domain/schemas";

export default async function EditSitePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireModerator(`/admin/sites/${id}`);
  const admin = isAdmin(user);
  if (!uuidSchema.safeParse(id).success) notFound();
  const db = await createSupabaseServerClient();
  const site = await getDiveSiteById(db, id);
  if (!site) notFound();
  // Species curation, reference photos and deletion are admin-only.
  const [siteSpecies, options] = admin
    ? await Promise.all([getSiteSpecies(db, site.id), listSpeciesOptions(db)])
    : [[], []];

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
        {admin && (
          <>
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
                <CardDescription>
                  Deleting a site also deletes its sightings, reviews and photos. Admins can restore it for 14 days.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DeleteWithReason
                  kind="dive_site"
                  id={site.id}
                  name={site.name}
                  consequence="Its sightings, reviews, photos, species links and suggestions are deleted with it."
                  redirectTo="/admin/sites"
                  buttonLabel="Delete dive site"
                  size="default"
                  variant="destructive"
                />
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </>
  );
}
