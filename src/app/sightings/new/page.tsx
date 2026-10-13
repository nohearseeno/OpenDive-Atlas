import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { SightingForm } from "@/components/sightings/sighting-form";
import { requireUser } from "@/application/session";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { listSiteOptions } from "@/infrastructure/repositories/dive-sites";
import { listSpeciesOptions } from "@/infrastructure/repositories/species";

export const metadata: Metadata = { title: "Log a sighting" };

export default async function NewSightingPage({ searchParams }: { searchParams: Promise<{ site?: string; species?: string }> }) {
  const params = await searchParams;
  const qs = new URLSearchParams(Object.entries(params).filter((e): e is [string, string] => typeof e[1] === "string"));
  const user = await requireUser(`/sightings/new${qs.size ? `?${qs}` : ""}`);
  const db = await createSupabaseServerClient();
  const [sites, species] = await Promise.all([listSiteOptions(db), listSpeciesOptions(db)]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <PageHeader
        title="Log a sighting"
        description="Tell the community what you saw. Sightings appear on the dive site and species pages straight away."
      />
      <Card>
        <CardContent>
          <SightingForm
            userId={user.id}
            sites={sites}
            species={species}
            defaultSiteId={sites.find((s) => s.slug === params.site)?.id}
            defaultSpeciesId={species.find((s) => s.slug === params.species)?.id}
          />
        </CardContent>
      </Card>
    </div>
  );
}
