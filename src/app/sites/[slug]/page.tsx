import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, Camera, CheckCircle2, ChevronRight, Fish, Plus, Star } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageBand } from "@/components/shared/page-band";
import { SiteFacts } from "@/components/sites/site-facts";
import { SiteSpeciesList } from "@/components/sites/site-species-list";
import { RatingSummary } from "@/components/sites/rating-summary";
import { PhotoGallery } from "@/components/photos/photo-gallery";
import { SightingList } from "@/components/sightings/sighting-list";
import { ReviewForm } from "@/components/reviews/review-form";
import { ReviewList } from "@/components/reviews/review-list";
import { SiteLocationMap } from "@/components/map/site-location-map";
import { getSessionUser, isAdmin, isModerator } from "@/application/session";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { getDiveSiteBySlug, getSiteSpecies } from "@/infrastructure/repositories/dive-sites";
import { getSpeciesCoverPhotos } from "@/infrastructure/repositories/species";
import { listSitePhotos } from "@/infrastructure/repositories/photos";
import { listSightings } from "@/infrastructure/repositories/sightings";
import { getUserReviewForSite, listReviews } from "@/infrastructure/repositories/reviews";
import { DIVE_TYPE_LABELS, EXPERIENCE_LABELS } from "@/domain/constants";
import { toMarker } from "@/infrastructure/repositories/mappers";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const site = await getDiveSiteBySlug(await createSupabaseServerClient(), slug);
  if (!site) return { title: "Dive site not found" };
  return {
    title: `${site.name}, ${site.country}`,
    description: site.description.slice(0, 160),
    alternates: { canonical: `/sites/${site.slug}` },
  };
}

export default async function SitePage({ params, searchParams }: Props) {
  const { slug } = await params;
  const flash = (await searchParams).sighting;
  const db = await createSupabaseServerClient();
  const site = await getDiveSiteBySlug(db, slug);
  if (!site) notFound();

  const user = await getSessionUser();
  const [siteSpecies, photos, sightings, reviews, myReview] = await Promise.all([
    getSiteSpecies(db, site.id),
    listSitePhotos(db, site.id),
    listSightings(db, { siteId: site.id, limit: 10 }),
    listReviews(db, { siteId: site.id, limit: 20 }),
    user ? getUserReviewForSite(db, site.id, user.id) : Promise.resolve(null),
  ]);
  const covers = await getSpeciesCoverPhotos(
    db,
    siteSpecies.map((s) => s.species.id),
  );
  // When the community has not uploaded site photos yet, show the marine life you may meet here.
  const galleryPhotos = photos.length ? photos : siteSpecies.flatMap((s) => covers.get(s.species.id) ?? []).slice(0, 8);

  return (
    <>
      <PageBand
        eyebrow={
          <nav aria-label="Breadcrumb" className="flex items-center gap-1">
            <Link href="/sites" className="hover:underline">
              Dive sites
            </Link>
            <ChevronRight className="size-3.5" aria-hidden />
            <span className="text-cream/80">{site.country}</span>
          </nav>
        }
        title={site.name}
        description={
          <div className="space-y-3">
            <p>{site.region}, {site.country}</p>
            <div className="flex flex-wrap items-center gap-1.5">
              {site.diveTypes.map((t) => (
                <Badge key={t} className="bg-cream/15 text-cream border-cream/30">
                  {DIVE_TYPE_LABELS[t]}
                </Badge>
              ))}
              <Badge variant={site.experienceLevel === "advanced" ? "coral" : "reef"}>
                {EXPERIENCE_LABELS[site.experienceLevel]}
              </Badge>
              {site.ratings.overall != null && (
                <span className="ml-1 inline-flex items-center gap-1 text-sm">
                  <Star className="size-4 fill-amber-300 text-amber-300" aria-hidden /> {site.ratings.overall.toFixed(1)} (
                  {site.ratings.reviewCount})
                </span>
              )}
              {!site.isPublished && <Badge variant="destructive">Unpublished</Badge>}
            </div>
          </div>
        }
        actions={
          <>
            <Button asChild variant="fin">
              <Link href={`/sightings/new?site=${site.slug}`}>
                <Plus /> Log a sighting here
              </Link>
            </Button>
            <Button asChild variant="cream">
              <Link href="#ratings">
                <Star /> Rate this site
              </Link>
            </Button>
            {isAdmin(user) && (
              <Button asChild variant="ghost" className="text-cream hover:bg-white/10 hover:text-cream">
                <Link href={`/admin/sites/${site.id}`}>Edit</Link>
              </Button>
            )}
          </>
        }
      />
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      {flash === "created" && (
        <Alert variant="success" className="mb-6">
          <CheckCircle2 />
          <AlertDescription>Thanks! Your sighting has been added.</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-10 lg:col-span-2">
          <section aria-labelledby="about" className="space-y-4">
            <h2 id="about" className="text-wall text-2xl font-semibold">
              About this site
            </h2>
            <p className="leading-relaxed whitespace-pre-line">{site.description}</p>
            {site.accessNotes && (
              <Alert>
                <AlertTriangle />
                <AlertDescription>
                  <p>
                    <strong>Access & safety:</strong> {site.accessNotes}
                  </p>
                </AlertDescription>
              </Alert>
            )}
          </section>

          <section aria-labelledby="marine-life" className="space-y-4">
            <div className="flex items-end justify-between gap-4">
              <h2 id="marine-life" className="text-wall text-2xl font-semibold">
                Marine life commonly seen here
              </h2>
              <span className="text-muted-foreground text-sm">{siteSpecies.length} species</span>
            </div>
            {siteSpecies.length ? (
              <SiteSpeciesList items={siteSpecies} covers={covers} />
            ) : (
              <EmptyState icon={<Fish />} title="No marine life recorded yet">
                Log a sighting to start this site&apos;s species list.
              </EmptyState>
            )}
          </section>

          <section aria-labelledby="photos" className="space-y-4">
            <h2 id="photos" className="text-wall text-2xl font-semibold">
              {photos.length ? "Photo gallery" : "Marine life you may encounter"}
            </h2>
            {galleryPhotos.length ? (
              <PhotoGallery photos={galleryPhotos} label={`Photos from ${site.name}`} />
            ) : (
              <EmptyState icon={<Camera />} title="No photos yet">
                Add photos to your sightings to build this gallery.
              </EmptyState>
            )}
          </section>

          <section id="sightings" aria-labelledby="sightings-title" className="scroll-mt-20 space-y-4">
            <div className="flex items-end justify-between gap-4">
              <h2 id="sightings-title" className="text-wall text-2xl font-semibold">
                Recent sightings
              </h2>
              <Link href={`/sightings/new?site=${site.slug}`} className="text-primary text-sm font-medium">
                Add yours →
              </Link>
            </div>
            {sightings.length ? (
              <SightingList sightings={sightings} showSite={false} currentUserId={user?.id} canModerate={isModerator(user)} />
            ) : (
              <EmptyState title="No sightings logged yet">Be the first to log what you saw here.</EmptyState>
            )}
          </section>

          <section id="ratings" aria-labelledby="ratings-title" className="scroll-mt-20 space-y-6">
            <h2 id="ratings-title" className="text-wall text-2xl font-semibold">
              Ratings & reviews
            </h2>
            <RatingSummary ratings={site.ratings} />
            <Card>
              <CardHeader>
                <CardTitle>{myReview ? "Update your rating" : "Rate this site"}</CardTitle>
              </CardHeader>
              <CardContent>
                {user ? (
                  <ReviewForm siteId={site.id} siteSlug={site.slug} existing={myReview} />
                ) : (
                  <p className="text-sm">
                    <Link href={`/login?next=/sites/${site.slug}%23ratings`} className="text-primary font-medium">
                      Log in
                    </Link>{" "}
                    to rate marine life, visibility, photography and difficulty.
                  </p>
                )}
              </CardContent>
            </Card>
            {reviews.length > 0 && (
              <ReviewList reviews={reviews} currentUserId={user?.id} canModerate={isModerator(user)} />
            )}
          </section>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start">
          <Card className="gap-4 py-5">
            <CardHeader className="px-5">
              <CardTitle>Site facts</CardTitle>
            </CardHeader>
            <CardContent className="px-5">
              <SiteFacts site={site} />
            </CardContent>
          </Card>
          <div className="h-64 overflow-hidden rounded-xl border">
            <SiteLocationMap marker={toMarker(site)} />
          </div>
          <p className="text-muted-foreground text-xs">
            Coordinates are approximate. Always confirm entry points, conditions and permits with a local operator.
          </p>
        </aside>
      </div>
    </div>
    </>
  );
}
