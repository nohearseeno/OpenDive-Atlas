import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Camera, CheckCircle2, ChevronRight, MapPin, PencilLine, Plus } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { SeabedEdge } from "@/components/shared/depth-edges";
import { PhotoImage } from "@/components/shared/photo-image";
import { PhotoGallery } from "@/components/photos/photo-gallery";
import { SightingList } from "@/components/sightings/sighting-list";
import { IucnBadge } from "@/components/species/iucn-badge";
import { getSessionUser, isAdmin, isModerator } from "@/application/session";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { getSpeciesBySlug, getSpeciesSites } from "@/infrastructure/repositories/species";
import { listSpeciesPhotos } from "@/infrastructure/repositories/photos";
import { listSightings } from "@/infrastructure/repositories/sightings";
import { CATEGORY_LABELS, FREQUENCY_LABELS } from "@/domain/constants";

type Props = { params: Promise<{ slug: string }>; searchParams?: Promise<{ suggestion?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const species = await getSpeciesBySlug(await createSupabaseServerClient(), slug);
  if (!species) return { title: "Species not found" };
  return {
    title: `${species.commonName} (${species.scientificName})`,
    description: species.description.slice(0, 160),
    alternates: { canonical: `/species/${species.slug}` },
  };
}

export default async function SpeciesPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const suggestionSent = (await searchParams)?.suggestion === "sent";
  const db = await createSupabaseServerClient();
  const species = await getSpeciesBySlug(db, slug);
  if (!species) notFound();

  const user = await getSessionUser();
  const [photos, sites, sightings] = await Promise.all([
    listSpeciesPhotos(db, species.id),
    getSpeciesSites(db, species.id),
    listSightings(db, { speciesId: species.id, limit: 10 }),
  ]);
  const hero = photos[0];

  return (
    <>
    <div className="bg-wall text-cream">
      <div className="mx-auto max-w-7xl px-4 pt-8 pb-8 sm:px-6">
        <nav aria-label="Breadcrumb" className="text-fin mb-6 flex items-center gap-1 text-sm">
          <Link href="/species" className="hover:underline">
            Marine life
          </Link>
          <ChevronRight className="size-3.5" aria-hidden />
          <span className="text-cream/80 truncate">{species.commonName}</span>
        </nav>
        <div className="grid gap-8 lg:grid-cols-5 lg:items-center">
          <div className="lg:col-span-2">
            <PhotoImage src={hero?.url} alt={hero?.caption ?? species.commonName} className="aspect-[4/3] w-full rounded-2xl" />
            {hero?.attribution && (
              <p className="text-cream/75 mt-2 text-xs">
                Photo © {hero.attribution}
                {hero.license && ` · ${hero.license}`}
                {hero.sourceUrl && (
                  <>
                    {" · "}
                    <a href={hero.sourceUrl} className="underline" target="_blank" rel="noreferrer">
                      Source
                    </a>
                  </>
                )}
              </p>
            )}
          </div>
          <div className="space-y-5 lg:col-span-3">
            <header className="space-y-2">
              <h1 className="text-sponge text-4xl leading-[1.05] font-semibold sm:text-5xl">{species.commonName}</h1>
              <p className="text-cream/85 text-lg italic">{species.scientificName}</p>
              <div className="flex flex-wrap gap-1.5">
                <Badge className="bg-cream/15 text-cream border-cream/30">{CATEGORY_LABELS[species.category]}</Badge>
                <IucnBadge status={species.iucnStatus} long className="text-cream border-cream/40" />
              </div>
            </header>
            <p className="text-cream/95 leading-relaxed whitespace-pre-line">{species.description}</p>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="fin">
                <Link href={`/sightings/new?species=${species.slug}`}>
                  <Plus /> I saw one!
                </Link>
              </Button>
              <Button asChild variant="ghost" className="text-cream hover:bg-white/10 hover:text-cream">
                <Link href={`/species/${species.slug}/suggest`}>
                  <PencilLine /> Suggest an edit
                </Link>
              </Button>
              {isAdmin(user) && (
                <Button asChild variant="ghost" className="text-cream hover:bg-white/10 hover:text-cream">
                  <Link href={`/admin/species/${species.id}`}>Edit</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
      <SeabedEdge className="fill-background" />
    </div>
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      {suggestionSent && (
        <Alert variant="success">
          <CheckCircle2 />
          <AlertDescription>Thanks! Your suggestion was sent. A moderator will review it before the page changes.</AlertDescription>
        </Alert>
      )}
      <div className="mt-10 grid gap-10 lg:grid-cols-3">
        <section aria-labelledby="where" className="space-y-4">
          <h2 id="where" className="text-wall text-2xl font-semibold">
            Where to see it
          </h2>
          {sites.length ? (
            <ul className="divide-y rounded-xl border">
              {sites.map(({ site, frequency, sightingCount }) => (
                <li key={site.id} className="hover:bg-accent/40 relative flex items-center gap-3 p-3">
                  <MapPin className="text-primary size-4 shrink-0" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <Link href={`/sites/${site.slug}`} className="font-medium after:absolute after:inset-0 hover:underline">
                      {site.name}
                    </Link>
                    <p className="text-muted-foreground truncate text-xs">
                      {site.region}, {site.country}
                      {sightingCount > 0 && ` · ${sightingCount} sightings`}
                    </p>
                  </div>
                  {frequency && <Badge variant="secondary">{FREQUENCY_LABELS[frequency]}</Badge>}
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No known sites yet">Log a sighting to put this species on the map.</EmptyState>
          )}
        </section>

        <div className="space-y-10 lg:col-span-2">
          <section aria-labelledby="gallery" className="space-y-4">
            <h2 id="gallery" className="text-wall text-2xl font-semibold">
              Photos
            </h2>
            {photos.length ? (
              <PhotoGallery photos={photos} label={`Photos of ${species.commonName}`} />
            ) : (
              <EmptyState icon={<Camera />} title="No photos yet">
                Share yours by logging a sighting with photos.
              </EmptyState>
            )}
          </section>
          <section aria-labelledby="sightings" className="space-y-4">
            <h2 id="sightings" className="text-wall text-2xl font-semibold">
              Recent sightings
            </h2>
            {sightings.length ? (
              <SightingList sightings={sightings} currentUserId={user?.id} canModerate={isModerator(user)} />
            ) : (
              <EmptyState title="No sightings yet" />
            )}
          </section>
        </div>
      </div>
    </div>
    </>
  );
}
