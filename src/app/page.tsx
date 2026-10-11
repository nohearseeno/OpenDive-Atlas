import Link from "next/link";
import { ArrowRight, Camera, Fish, Map, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteCard } from "@/components/sites/site-card";
import { SightingList } from "@/components/sightings/sighting-list";
import { SetupNotice } from "@/components/shared/setup-notice";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { isSupabaseConfigured } from "@/infrastructure/supabase/env";
import { countDiveSites, searchDiveSites } from "@/infrastructure/repositories/dive-sites";
import { countSpecies } from "@/infrastructure/repositories/species";
import { countSightings, listSightings } from "@/infrastructure/repositories/sightings";

const STEPS = [
  { icon: Map, title: "Explore the map", text: "Browse dive sites worldwide and filter by reef, wreck, shore, boat or level." },
  { icon: Fish, title: "Meet the locals", text: "See which marine life is commonly sighted at each site, with photos." },
  { icon: Camera, title: "Log your sightings", text: "Record what you saw, add photos and help map marine life over time." },
  { icon: Users, title: "Rate & review", text: "Rate marine life, visibility, photography and difficulty for other divers." },
];

async function loadHome() {
  const db = await createSupabaseServerClient();
  const [sites, siteCount, speciesCount, sightingCount, recent] = await Promise.all([
    searchDiveSites(db),
    countDiveSites(db),
    countSpecies(db),
    countSightings(db),
    listSightings(db, { limit: 3 }),
  ]);
  const featured = [...sites]
    .sort((a, b) => (b.ratings.overall ?? 0) - (a.ratings.overall ?? 0) || b.speciesCount - a.speciesCount)
    .slice(0, 6);
  return { featured, siteCount, speciesCount, sightingCount, recent };
}

export default async function HomePage() {
  const configured = isSupabaseConfigured();
  const data = configured ? await loadHome() : null;

  return (
    <>
      <section className="from-primary/15 via-reef/10 to-background relative overflow-hidden bg-gradient-to-b">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:py-24">
          <div className="max-w-3xl space-y-6">
            <p className="text-primary inline-flex items-center gap-2 text-sm font-medium">
              <MapPin className="size-4" /> Open-source · Community-powered
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl md:text-6xl">
              Discover dive sites and the marine life that lives there.
            </h1>
            <p className="text-muted-foreground max-w-2xl text-lg">
              OpenDive Atlas is a free, open map of the underwater world. Find your next dive, learn what you might see,
              and contribute your own sightings and photos.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/map">
                  Explore the map <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/species">Browse marine life</Link>
              </Button>
            </div>
          </div>
          {data && (
            <dl className="grid max-w-xl grid-cols-3 gap-4">
              {[
                { label: "Dive sites", value: data.siteCount },
                { label: "Species", value: data.speciesCount },
                { label: "Sightings", value: data.sightingCount },
              ].map((s) => (
                <div key={s.label} className="bg-background/70 rounded-xl border p-4 backdrop-blur">
                  <dt className="text-muted-foreground text-xs sm:text-sm">{s.label}</dt>
                  <dd className="text-2xl font-bold sm:text-3xl">{s.value.toLocaleString()}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-16 px-4 py-12 sm:px-6">
        {!configured && <SetupNotice />}

        <section aria-labelledby="how" className="space-y-6">
          <h2 id="how" className="text-2xl font-bold tracking-tight">
            How it works
          </h2>
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <li key={step.title} className="bg-card space-y-2 rounded-xl border p-5">
                <div className="flex items-center gap-2">
                  <span className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-lg">
                    <step.icon className="size-4" aria-hidden />
                  </span>
                  <span className="text-muted-foreground text-xs">Step {i + 1}</span>
                </div>
                <h3 className="font-semibold">{step.title}</h3>
                <p className="text-muted-foreground text-sm">{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

        {data && data.featured.length > 0 && (
          <section aria-labelledby="featured" className="space-y-6">
            <div className="flex items-end justify-between gap-4">
              <h2 id="featured" className="text-2xl font-bold tracking-tight">
                Featured dive sites
              </h2>
              <Link href="/sites" className="text-primary text-sm font-medium">
                All sites →
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.featured.map((site) => (
                <SiteCard key={site.id} site={site} />
              ))}
            </div>
          </section>
        )}

        {data && data.recent.length > 0 && (
          <section aria-labelledby="recent" className="space-y-6">
            <div className="flex items-end justify-between gap-4">
              <h2 id="recent" className="text-2xl font-bold tracking-tight">
                Latest community sightings
              </h2>
              <Link href="/sightings" className="text-primary text-sm font-medium">
                All sightings →
              </Link>
            </div>
            <SightingList sightings={data.recent} />
          </section>
        )}
      </div>
    </>
  );
}
