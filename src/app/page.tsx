/* eslint-disable @next/next/no-img-element -- hero photo is served from Supabase Storage */
import Link from "next/link";
import { ArrowRight, Camera, Fish, Map, Sparkles, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteCard } from "@/components/sites/site-card";
import { SightingList } from "@/components/sightings/sighting-list";
import { SetupNotice } from "@/components/shared/setup-notice";
import { DepthProfile, SeabedEdge } from "@/components/shared/depth-edges";
import { SquirrelfishGlyph, TOP_CONTRIBUTOR_LABEL } from "@/components/shared/top-contributor-badge";
import { DIVE_TYPE_LABELS, FILTER_DIVE_TYPES, TOP_CONTRIBUTOR_THRESHOLD } from "@/domain/constants";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { isSupabaseConfigured } from "@/infrastructure/supabase/env";
import { countDiveSites, searchDiveSites } from "@/infrastructure/repositories/dive-sites";
import { countSpecies } from "@/infrastructure/repositories/species";
import { countSightings, listSightings } from "@/infrastructure/repositories/sightings";
import { getFeaturedPhoto } from "@/infrastructure/repositories/photos";

const STEPS: { icon: typeof Map; title: string; text: string; reward?: React.ReactNode }[] = [
  { icon: Map, title: "Explore the map", text: "Browse dive sites worldwide and filter by reef, wreck, shore, boat or experience level." },
  { icon: Fish, title: "Meet the locals", text: "See which marine life is commonly sighted at each site, with photos." },
  {
    icon: Camera,
    title: "Log your sightings",
    text: "Record what you saw, add photos, and help map marine life over time.",
    reward: (
      <>
        Add {TOP_CONTRIBUTOR_THRESHOLD} approved sites, and you&apos;ll be invited to become a{" "}
        <strong className="text-sponge-ink font-semibold">{TOP_CONTRIBUTOR_LABEL}</strong>, with a squirrelfish badge on
        your avatar.{" "}
        <Link href="/sites/suggest" className="text-wall font-medium underline underline-offset-4">
          Suggest a site →
        </Link>
      </>
    ),
  },
  { icon: Star, title: "Rate the dive", text: "Score marine life, visibility, photography and difficulty for the next diver." },
];

async function loadHome() {
  const db = await createSupabaseServerClient();
  const [sites, siteCount, speciesCount, sightingCount, recent, hero] = await Promise.all([
    searchDiveSites(db),
    countDiveSites(db),
    countSpecies(db),
    countSightings(db),
    listSightings(db, { limit: 3 }),
    getFeaturedPhoto(db),
  ]);
  const featured = [...sites]
    .sort((a, b) => (b.ratings.overall ?? 0) - (a.ratings.overall ?? 0) || b.speciesCount - a.speciesCount)
    .slice(0, 6);
  return { featured, siteCount, speciesCount, sightingCount, recent, hero };
}

export default async function HomePage() {
  const configured = isSupabaseConfigured();
  const data = configured ? await loadHome() : null;
  const hero = data?.hero ?? null;

  return (
    <>
      <section className="bg-reef-hole text-cream relative isolate overflow-hidden">
        {hero ? (
          <img src={hero.url} alt="" aria-hidden className="absolute inset-0 -z-20 size-full object-cover object-[center_45%]" />
        ) : (
          <div aria-hidden className="from-wall-deep via-reef-hole to-reef-hole absolute inset-0 -z-20 bg-gradient-to-b" />
        )}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(13,17,41,.65)_0%,rgba(13,17,41,.3)_40%,rgba(13,17,41,.5)_72%,rgba(13,17,41,.9)_100%)]"
        />
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-4 pt-20 pb-28 text-center sm:pt-28 sm:pb-36">
          <h1 className="text-[clamp(2.5rem,7vw,4.75rem)] leading-[1.02] font-semibold drop-shadow-[0_2px_24px_rgba(5,10,30,.5)]">
            Find a dive site.
            <br />
            Meet who lives there.
          </h1>
          <p className="text-cream/90 max-w-2xl text-base sm:text-lg">
            OpenDive Atlas is an open, community-built map of the world&apos;s dive sites and the marine life seen at each
            one. Explore, log your sightings, and help other divers know what to expect.
          </p>
          <form action="/map" role="search" className="flex w-full max-w-xl flex-col gap-2 sm:flex-row">
            <label htmlFor="hero-q" className="sr-only">
              Search dive sites
            </label>
            <input
              id="hero-q"
              name="q"
              type="search"
              maxLength={100}
              placeholder="Search a site, country or region"
              className="border-cream/40 bg-cream/10 placeholder:text-cream/70 focus-visible:ring-fin/60 h-12 min-w-0 flex-1 rounded-full border px-5 text-base outline-none backdrop-blur focus-visible:ring-[3px]"
            />
            <Button type="submit" variant="fin" size="lg" className="h-12">
              Explore the map <ArrowRight />
            </Button>
          </form>
          <Link href="/recommend" className="text-cream/90 hover:text-cream -mt-2 inline-flex items-center gap-1.5 text-sm underline underline-offset-4">
            <Sparkles className="size-4" aria-hidden /> Not sure where to go? Describe your ideal dive
          </Link>
          <nav aria-label="Browse by dive type" className="flex flex-wrap justify-center gap-2">
            {FILTER_DIVE_TYPES.map((t) => (
              <Link
                key={t}
                href={`/map?type=${t}`}
                className="border-cream/40 hover:bg-cream hover:text-reef-hole rounded-full border px-3.5 py-1 text-sm transition-colors"
              >
                {DIVE_TYPE_LABELS[t]}
              </Link>
            ))}
          </nav>
        </div>
        {hero && (
          <p className="text-cream/80 absolute right-4 bottom-24 text-xs sm:bottom-32">
            {hero.caption ?? hero.speciesName}
            {hero.attribution && <> · Photo © {hero.attribution}</>}
          </p>
        )}
        <DepthProfile className="fill-wall absolute inset-x-0 -bottom-px" />
      </section>

      {!configured && (
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <SetupNotice />
        </div>
      )}

      {data && (
        <section aria-labelledby="featured" className="bg-wall text-cream">
          <div className="mx-auto max-w-7xl space-y-8 px-4 pt-6 pb-14 sm:px-6">
            <div className="border-cream/40 flex flex-wrap items-end justify-between gap-4 border-b pb-4">
              <h2 id="featured" className="text-sponge text-3xl font-semibold sm:text-4xl">
                Featured dive sites
              </h2>
              <Link href="/sites" className="text-cream text-sm underline underline-offset-4">
                All {data.siteCount} sites →
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.featured.map((site) => (
                <SiteCard key={site.id} site={site} />
              ))}
            </div>
            <dl className="text-cream/90 flex flex-wrap gap-x-10 gap-y-3 pt-2">
              {[
                { label: "dive sites", value: data.siteCount },
                { label: "species", value: data.speciesCount },
                { label: "community sightings", value: data.sightingCount },
              ].map((s) => (
                <div key={s.label} className="flex items-baseline gap-2">
                  <dd className="font-display text-sponge text-3xl font-semibold tabular-nums">{s.value.toLocaleString()}</dd>
                  <dt className="text-sm">{s.label}</dt>
                </div>
              ))}
            </dl>
          </div>
          <SeabedEdge className="fill-background" />
        </section>
      )}

      <div className="mx-auto max-w-7xl space-y-16 px-4 py-10 sm:px-6">
        <section aria-labelledby="how" className="space-y-6">
          <h2 id="how" className="text-wall text-3xl font-semibold">
            How it works
          </h2>
          <ol className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step) => (
              <li key={step.title} className="space-y-2">
                <span className="bg-wall text-fin flex size-11 items-center justify-center rounded-full">
                  <step.icon className="size-5" aria-hidden />
                </span>
                <h3 className="text-lg font-semibold">{step.title}</h3>
                <p className="text-muted-foreground text-sm">{step.text}</p>
                {step.reward && (
                  <p className="bg-sponge/15 flex gap-2 rounded-lg p-2.5 text-sm">
                    <span className="bg-sponge text-sponge-ink mt-0.5 grid size-5 shrink-0 place-items-center rounded-full">
                      <SquirrelfishGlyph className="w-4" />
                    </span>
                    <span>{step.reward}</span>
                  </p>
                )}
              </li>
            ))}
          </ol>
        </section>

        {data && data.recent.length > 0 && (
          <section aria-labelledby="recent" className="space-y-6">
            <div className="flex items-end justify-between gap-4">
              <h2 id="recent" className="text-wall text-3xl font-semibold">
                Latest sightings
              </h2>
              <Link href="/sightings" className="text-wall text-sm font-medium underline underline-offset-4">
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
