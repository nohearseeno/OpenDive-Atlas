import type { Metadata } from "next";
import Link from "next/link";
import { Camera, CheckCircle2, Fish, MapPinPlus, ShieldCheck, Star } from "lucide-react";
import { PageBand } from "@/components/shared/page-band";
import { SquirrelfishGlyph, TOP_CONTRIBUTOR_LABEL } from "@/components/shared/top-contributor-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSessionUser } from "@/application/session";
import { TOP_CONTRIBUTOR_THRESHOLD } from "@/domain/constants";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";

export const metadata: Metadata = {
  title: "Help build the atlas",
  description:
    "OpenDive Atlas is a free, open, community-built map of dive sites and marine life. Add sites, confirm details, log sightings or volunteer as a moderator.",
  alternates: { canonical: "/contribute" },
};

async function stats() {
  const db = await createSupabaseServerClient();
  const head = { count: "exact" as const, head: true };
  const [sites, unverified, species, sightings] = await Promise.all([
    db.from("dive_sites").select("id", head).eq("is_published", true),
    db.from("dive_sites").select("id", head).eq("is_published", true).eq("is_verified", false).is("ai_reviewed_at", null),
    db.from("species").select("id", head),
    db.from("sightings").select("id", head).eq("status", "approved"),
  ]);
  return { sites: sites.count ?? 0, unverified: unverified.count ?? 0, species: species.count ?? 0, sightings: sightings.count ?? 0 };
}

export default async function ContributePage() {
  const [user, s] = await Promise.all([getSessionUser(), stats()]);
  const isStaff = user?.profile?.role === "moderator" || user?.profile?.role === "admin";

  const ways = [
    {
      icon: CheckCircle2,
      title: "Confirm a site you've dived",
      text: `${s.unverified.toLocaleString("en-GB")} of our ${s.sites.toLocaleString("en-GB")} sites are starter entries no diver has checked yet. Open one you know and confirm or correct the details.`,
      href: "/sites",
      cta: "Browse sites",
    },
    {
      icon: MapPinPlus,
      title: "Add a missing site",
      text: "Know a site that isn't on the map? Suggest it with its location and conditions. Our AI moderator checks it within minutes.",
      href: "/sites/suggest",
      cta: "Suggest a site",
    },
    {
      icon: Camera,
      title: "Log what you saw",
      text: "Every sighting, with a date and photo, helps show which marine life is around each site, and when.",
      href: "/sightings/new",
      cta: "Log a sighting",
    },
    {
      icon: Star,
      title: "Rate a dive",
      text: "Score marine life, visibility, photography and difficulty so the next diver knows what to expect.",
      href: "/sites",
      cta: "Find a site to rate",
    },
    {
      icon: Fish,
      title: "Improve the species guide",
      text: `${s.species.toLocaleString("en-GB")} species so far. Add one that's missing or correct a name, category or conservation status.`,
      href: "/species/suggest",
      cta: "Suggest a species",
    },
    {
      icon: ShieldCheck,
      title: "Volunteer as a moderator",
      text: "Review suggestions and keep the atlas accurate and friendly. A few minutes a week makes a real difference.",
      href: "/contribute/moderate",
      cta: isStaff ? "You're a moderator. Thank you!" : "Volunteer",
    },
  ];

  return (
    <>
      <PageBand
        eyebrow="Get involved"
        title="Help build the atlas"
        description="OpenDive Atlas is free, open source and built by divers. Everything here, from the sites to the sightings, comes from people like you."
        actions={
          user ? undefined : (
            <>
              <Button asChild variant="fin">
                <Link href="/signup?next=/contribute">Create a free account</Link>
              </Button>
              <Button asChild variant="ghost" className="text-cream hover:text-cream hover:bg-white/10">
                <Link href="/login?next=/contribute">Log in</Link>
              </Button>
            </>
          )
        }
      />
      <div className="mx-auto max-w-7xl space-y-10 px-4 py-8 sm:px-6">
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            ["Dive sites", s.sites],
            ["Waiting for a diver to confirm", s.unverified],
            ["Marine species", s.species],
            ["Community sightings", s.sightings],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border p-4">
              <dt className="text-muted-foreground text-sm">{label}</dt>
              <dd className="text-2xl font-semibold">{Number(value).toLocaleString("en-GB")}</dd>
            </div>
          ))}
        </dl>

        <section aria-labelledby="ways" className="space-y-4">
          <h2 id="ways" className="text-2xl font-semibold">
            Ways to help
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ways.map((w) => (
              <Card key={w.title} className="gap-3">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <w.icon className="text-primary size-5" aria-hidden /> {w.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-muted-foreground text-sm">{w.text}</p>
                  <Link href={w.href} className="text-wall text-sm font-medium underline underline-offset-4">
                    {w.cta} →
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="bg-sponge/15 flex flex-col gap-4 rounded-2xl p-6 sm:flex-row sm:items-center">
          <SquirrelfishGlyph className="w-14 shrink-0" />
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Become a {TOP_CONTRIBUTOR_LABEL}</h2>
            <p className="text-sm">
              Add {TOP_CONTRIBUTOR_THRESHOLD} approved sites, and you&apos;ll be invited to become a {TOP_CONTRIBUTOR_LABEL},
              with a squirrelfish badge on your avatar.
            </p>
          </div>
        </section>

        <p className="text-muted-foreground text-sm">
          OpenDive Atlas is open source.{" "}
          <a href="https://github.com/nohearseeno/opendive-atlas" className="underline" target="_blank" rel="noreferrer">
            See the code on GitHub
          </a>{" "}
          or read{" "}
          <Link href="/about" className="underline">
            about the project
          </Link>
          .
        </p>
      </div>
    </>
  );
}
